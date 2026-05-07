import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Navigation, Layers,
  AlertTriangle, Package, ChevronDown,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useItems } from "../context/ItemContext";
import PageWrapper from "../components/common/PageWrapper";

// ── Fix Leaflet default icon paths broken by Vite ───────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom SVG pin icons ─────────────────────────────────────────────────────
function makeSvgIcon(fill, label) {
  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 9.941 15 25 15 25S30 24.941 30 15C30 6.716 23.284 0 15 0z"
          fill="${fill}" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
    <circle cx="15" cy="15" r="6.5" fill="white" opacity="0.92"/>
    <text x="15" y="19" text-anchor="middle" font-size="8"
          font-family="Inter,system-ui,sans-serif" font-weight="800" fill="${fill}">${label}</text>
  </svg>`;
  return L.divIcon({
    html,
    className: "",
    iconSize:    [30, 40],
    iconAnchor:  [15, 40],
    popupAnchor: [0, -42],
  });
}

const ICON_LOST  = makeSvgIcon("#ef4444", "L");
const ICON_FOUND = makeSvgIcon("#22c55e", "F");
const ICON_USER  = makeSvgIcon("#6366f1", "●");

// ── Cluster icon factory ─────────────────────────────────────────────────────
function makeClusterIcon(count, hasLost, hasFound) {
  const color = hasLost && hasFound ? "#8b5cf6" : hasLost ? "#ef4444" : "#22c55e";
  const html = `<div style="
    width:36px;height:36px;border-radius:50%;
    background:${color};border:2.5px solid white;
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:12px;font-weight:800;
    font-family:Inter,system-ui,sans-serif;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);">${count}</div>`;
  return L.divIcon({ html, className: "", iconSize: [36, 36], iconAnchor: [18, 18] });
}

// ── Campus default centre — change to your campus coords ────────────────────
const CAMPUS_CENTER = [13.0827, 80.2707];
const CAMPUS_ZOOM   = 15;

const CATEGORIES = ["All","Electronics","Stationery","Keys","Clothing","Accessories","Documents","Other"];

// ── Simple grid-based clustering (no external lib needed) ────────────────────
// Groups markers that are within `cellDeg` degrees of each other.
function clusterItems(items, cellDeg = 0.0008) {
  const cells = {};
  items.forEach((item) => {
    const coords = item.publicGeoLocation?.coordinates ?? item.geoLocation?.coordinates;
    if (!coords || coords.length < 2) return;
    const [lng, lat] = coords;
    const key = `${Math.round(lat / cellDeg)}_${Math.round(lng / cellDeg)}`;
    if (!cells[key]) cells[key] = { items: [], lat: 0, lng: 0 };
    cells[key].items.push(item);
    cells[key].lat += lat;
    cells[key].lng += lng;
  });
  return Object.values(cells).map((cell) => ({
    items:    cell.items,
    lat:      cell.lat / cell.items.length,
    lng:      cell.lng / cell.items.length,
    isSingle: cell.items.length === 1,
  }));
}

// ── Hotspot detection ────────────────────────────────────────────────────────
function computeHotspots(items, cellDeg = 0.003) {
  const cells = {};
  items.forEach((item) => {
    const coords = item.publicGeoLocation?.coordinates ?? item.geoLocation?.coordinates;
    if (!coords) return;
    const [lng, lat] = coords;
    const key = `${Math.floor(lat / cellDeg)}_${Math.floor(lng / cellDeg)}`;
    if (!cells[key]) cells[key] = { lat: 0, lng: 0, count: 0 };
    cells[key].lat += lat;
    cells[key].lng += lng;
    cells[key].count += 1;
  });
  return Object.values(cells)
    .filter((c) => c.count >= 2)
    .map((c) => ({ lat: c.lat / c.count, lng: c.lng / c.count, count: c.count }));
}

// ── FlyTo helper ─────────────────────────────────────────────────────────────
function FlyTo({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, zoom ?? 17, { duration: 1.2 });
  }, [coords, zoom, map]);
  return null;
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function MapPage() {
  const navigate = useNavigate();
  const { items, fetchItems, loading } = useItems();

  const [showLost,    setShowLost]    = useState(true);
  const [showFound,   setShowFound]   = useState(true);
  const [category,    setCategory]    = useState("All");
  const [keyword,     setKeyword]     = useState("");
  const [showHotspot, setShowHotspot] = useState(true);
  const [userCoords,  setUserCoords]  = useState(null);
  const [flyTarget,   setFlyTarget]   = useState(null);
  const [catOpen,     setCatOpen]     = useState(false);
  const [locError,    setLocError]    = useState("");

  // Fetch only AVAILABLE items for the map — reduces payload (Req 4.1, 4.2)
  useEffect(() => { fetchItems({ status: 'AVAILABLE' }); }, []);

  // Filtered items with coordinates
  const mappableItems = useMemo(() => items.filter((item) => {
    const coords = item.publicGeoLocation?.coordinates ?? item.geoLocation?.coordinates;
    if (!coords || coords.length < 2) return false;
    if (!showLost  && item.type === "lost")  return false;
    if (!showFound && item.type === "found") return false;
    if (category !== "All" && item.category !== category) return false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      if (
        !item.title.toLowerCase().includes(kw) &&
        !item.category.toLowerCase().includes(kw) &&
        !(item.location ?? "").toLowerCase().includes(kw)
      ) return false;
    }
    return true;
  }), [items, showLost, showFound, category, keyword]);

  const clusters  = useMemo(() => clusterItems(mappableItems), [mappableItems]);
  const hotspots  = useMemo(() => showHotspot ? computeHotspots(mappableItems) : [], [mappableItems, showHotspot]);

  const handleMyLocation = useCallback(() => {
    setLocError("");
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(c);
        setFlyTarget({ coords: c, zoom: 17 });
      },
      () => setLocError("Unable to get your location"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <PageWrapper>
      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

        {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 z-[1000] px-4 py-2.5 bg-[rgba(15,23,42,0.94)] backdrop-blur-xl border-b border-white/10 flex flex-wrap items-center gap-2.5"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-[140px] max-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Lost / Found toggles */}
          <button
            onClick={() => setShowLost((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              showLost ? "bg-red-500/25 border-red-400/50 text-red-300" : "bg-white/5 border-white/10 text-slate-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" /> Lost
          </button>
          <button
            onClick={() => setShowFound((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              showFound ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-300" : "bg-white/5 border-white/10 text-slate-500"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" /> Found
          </button>

          {/* Category dropdown */}
          <div className="relative">
            <button
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold"
            >
              <Filter size={12} /> {category}
              <ChevronDown size={12} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {catOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full mt-1 left-0 z-[2000] bg-[rgba(15,23,42,0.98)] border border-white/15 rounded-xl overflow-hidden shadow-2xl min-w-[140px]"
                >
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setCatOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition ${
                        category === cat ? "bg-blue-600/40 text-blue-200" : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hotspot toggle */}
          <button
            onClick={() => setShowHotspot((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              showHotspot ? "bg-orange-500/25 border-orange-400/50 text-orange-300" : "bg-white/5 border-white/10 text-slate-500"
            }`}
          >
            <Layers size={12} /> Hotspots
          </button>

          {/* My location */}
          <button
            onClick={handleMyLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/35 border border-indigo-400/50 text-indigo-200 text-xs font-bold hover:bg-indigo-600/55 transition"
          >
            <Navigation size={12} /> My Location
          </button>

          {/* Count + error */}
          <span className="ml-auto text-xs text-slate-400 font-semibold whitespace-nowrap">
            {loading ? "Loading…" : `${mappableItems.length} item${mappableItems.length !== 1 ? "s" : ""} on map`}
          </span>
          {locError && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle size={11} /> {locError}
            </span>
          )}
        </motion.div>

        {/* ── MAP ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <MapContainer
            center={CAMPUS_CENTER}
            zoom={CAMPUS_ZOOM}
            zoomControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              maxZoom={20}
            />
            <ZoomControl position="bottomright" />

            {flyTarget && <FlyTo coords={flyTarget.coords} zoom={flyTarget.zoom} />}

            {/* Hotspot circles */}
            {hotspots.map((hs, i) => (
              <Circle
                key={i}
                center={[hs.lat, hs.lng]}
                radius={80 + hs.count * 25}
                pathOptions={{
                  color: "#f97316", fillColor: "#f97316",
                  fillOpacity: 0.13, weight: 2, dashArray: "6 4",
                }}
              />
            ))}

            {/* Clustered / single markers */}
            {clusters.map((cluster, i) => {
              if (cluster.isSingle) {
                const item   = cluster.items[0];
                const icon   = item.type === "lost" ? ICON_LOST : ICON_FOUND;
                return (
                  <Marker key={item._id} position={[cluster.lat, cluster.lng]} icon={icon}>
                    <Popup minWidth={210}>
                      <div style={{ fontFamily: "Inter,system-ui,sans-serif", padding: "4px" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 999,
                          fontSize: 11, fontWeight: 700, marginBottom: 6,
                          background: item.type === "lost" ? "#fee2e2" : "#dcfce7",
                          color:      item.type === "lost" ? "#b91c1c" : "#15803d",
                        }}>
                          {item.type === "lost" ? "Lost" : "Found"}
                        </span>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6, marginBottom: 8 }}>
                          <div>📦 {item.category}</div>
                          <div>📍 {item.location}</div>
                          <div>📅 {new Date(item.date).toLocaleDateString()}</div>
                          {item.status && (
                            <div>🔖 {item.status.replace(/_/g, " ").toLowerCase()}</div>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/item/${item._id}`)}
                          style={{
                            width: "100%", padding: "6px 0", borderRadius: 8,
                            background: "#4f46e5", color: "white",
                            fontSize: 11, fontWeight: 700, border: "none",
                            cursor: "pointer",
                          }}
                        >
                          View Details →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              // Cluster marker
              const hasLost  = cluster.items.some((it) => it.type === "lost");
              const hasFound = cluster.items.some((it) => it.type === "found");
              const clusterIcon = makeClusterIcon(cluster.items.length, hasLost, hasFound);
              return (
                <Marker key={`cluster-${i}`} position={[cluster.lat, cluster.lng]} icon={clusterIcon}>
                  <Popup minWidth={200}>
                    <div style={{ fontFamily: "Inter,system-ui,sans-serif", padding: "4px" }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 8 }}>
                        {cluster.items.length} items in this area
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {cluster.items.slice(0, 4).map((item) => (
                          <button
                            key={item._id}
                            onClick={() => navigate(`/item/${item._id}`)}
                            style={{
                              textAlign: "left", padding: "5px 8px", borderRadius: 8,
                              background: item.type === "lost" ? "#fee2e2" : "#dcfce7",
                              border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                              color: item.type === "lost" ? "#b91c1c" : "#15803d",
                            }}
                          >
                            {item.type === "lost" ? "L" : "F"} · {item.title}
                          </button>
                        ))}
                        {cluster.items.length > 4 && (
                          <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>
                            +{cluster.items.length - 4} more — zoom in to see all
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* User location */}
            {userCoords && (
              <Marker position={userCoords} icon={ICON_USER}>
                <Popup>
                  <div style={{ fontFamily: "Inter,system-ui,sans-serif", fontWeight: 700, fontSize: 13, color: "#0f172a", padding: "4px" }}>
                    📍 You are here
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-6 left-4 z-[999] bg-[rgba(15,23,42,0.9)] backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-xl"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legend</p>
            {[
              { color: "bg-red-500",     label: "Lost item" },
              { color: "bg-emerald-500", label: "Found item" },
              { color: "bg-purple-500",  label: "Cluster" },
              { color: "bg-orange-400 opacity-60", label: "Hotspot zone" },
              { color: "bg-indigo-500",  label: "Your location" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                <span className="text-xs text-slate-300">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* No items notice */}
          {!loading && mappableItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999] bg-[rgba(15,23,42,0.93)] border border-white/15 rounded-2xl px-6 py-5 text-center shadow-2xl"
            >
              <Package size={30} className="text-slate-400 mx-auto mb-2" />
              <p className="text-white font-bold text-sm">No items match your filters</p>
              <p className="text-slate-400 text-xs mt-1 max-w-[220px]">
                Items appear only when GPS coordinates were captured during reporting.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
