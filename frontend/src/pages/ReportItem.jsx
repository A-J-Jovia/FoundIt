import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useItems } from "../context/ItemContext";
import LocationPicker from "../components/common/LocationPicker";
import { compressImage, getFileSizeKB } from "../utils/imageCompression";
import PageWrapper from "../components/common/PageWrapper";

export default function ReportItem() {
  const navigate = useNavigate();
  const { createItem } = useItems();

  const [title, setTitle]               = useState("");
  const [type, setType]                 = useState("found");
  const [category, setCategory]         = useState("");
  const [location, setLocation]         = useState("");
  const [date, setDate]                 = useState(new Date().toISOString().split("T")[0]);
  const [primaryColor, setPrimaryColor] = useState("");
  const [brand, setBrand]               = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [geoLocation, setGeoLocation]   = useState(null);
  const [urgencyLevel, setUrgencyLevel] = useState("MEDIUM");
  const [reward, setReward]             = useState("");
  const [loading, setLoading]           = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      try {
        setLoading(true);
        const compressed = await compressImage(file, 1200, 0.8);
        setImagePreview(compressed);
      } catch (err) {
        alert("Failed to compress image: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLocationSelect = (data) => {
    setGeoLocation(data);
    if (!location) setLocation(data.address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const itemData = {
      title, type, category, location, date,
      colorPalette: { primary: primaryColor },
      brandModel: brand,
      imageURL: imagePreview,
    };

    if (geoLocation) {
      itemData.lat = geoLocation.lat;
      itemData.lng = geoLocation.lng;
    }

    if (type === "lost") {
      itemData.urgencyLevel = urgencyLevel;
      if (reward) itemData.reward = parseFloat(reward);
    }

    const result = await createItem(itemData);
    setLoading(false);

    if (result.success) {
      alert("Item reported successfully!");
      navigate(type === "found" ? "/found" : "/lost");
    } else {
      alert(result.message || "Failed to report item");
    }
  };

  // ── Shared field styles ────────────────────────────────────────────────────
  // Using plain HTML style objects so nothing from global CSS can interfere.
  const fieldStyle = {
    width: "100%",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",          // white text for typed content
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#e2e8f0",
  };

  const fieldWrap = { marginBottom: "0" };

  return (
    <PageWrapper>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>

        {/* Card */}
        <div style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(15,23,42,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "24px",
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>

          <h2 style={{ color: "#ffffff", fontSize: "26px", fontWeight: 800, textAlign: "center", marginBottom: "28px", marginTop: 0 }}>
            Report an Item
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Item Type */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Item Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={fieldStyle}>
                <option value="found" style={{ background: "#1e3a5f", color: "#fff" }}>Found Item</option>
                <option value="lost"  style={{ background: "#1e3a5f", color: "#fff" }}>Lost Item</option>
              </select>
            </div>

            {/* Title */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Black Wallet"
                style={{ ...fieldStyle, "::placeholder": { color: "rgba(255,255,255,0.4)" } }}
              />
            </div>

            {/* Category */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Category</label>
              <select required value={category} onChange={(e) => setCategory(e.target.value)} style={fieldStyle}>
                <option value=""            style={{ background: "#1e3a5f", color: "#fff" }}>Select Category</option>
                <option value="Electronics" style={{ background: "#1e3a5f", color: "#fff" }}>Electronics</option>
                <option value="Stationery"  style={{ background: "#1e3a5f", color: "#fff" }}>Stationery</option>
                <option value="Keys"        style={{ background: "#1e3a5f", color: "#fff" }}>Keys</option>
                <option value="Clothing"    style={{ background: "#1e3a5f", color: "#fff" }}>Clothing</option>
                <option value="Accessories" style={{ background: "#1e3a5f", color: "#fff" }}>Accessories</option>
                <option value="Documents"   style={{ background: "#1e3a5f", color: "#fff" }}>Documents</option>
                <option value="Other"       style={{ background: "#1e3a5f", color: "#fff" }}>Other</option>
              </select>
            </div>

            {/* Location */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Building, Room, etc."
                style={fieldStyle}
              />
            </div>

            {/* Pin Location */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Pin Location (Optional)</label>
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>

            {/* Date */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ ...fieldStyle, colorScheme: "dark" }}
              />
            </div>

            {/* Upload Photo */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Upload Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ ...fieldStyle, padding: "8px 12px", cursor: "pointer" }}
              />
              {imagePreview && (
                <div style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <img src={imagePreview} alt="Preview" draggable="false" style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                </div>
              )}
            </div>

            {/* Primary Color */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Primary Color</label>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="e.g., Black, Blue"
                style={fieldStyle}
              />
            </div>

            {/* Brand / Model */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Brand / Model (optional)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Apple iPhone 13"
                style={fieldStyle}
              />
            </div>

            {/* Lost-only fields */}
            {type === "lost" && (
              <>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Urgency Level</label>
                  <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)} style={fieldStyle}>
                    <option value="LOW"    style={{ background: "#1e3a5f", color: "#fff" }}>Low</option>
                    <option value="MEDIUM" style={{ background: "#1e3a5f", color: "#fff" }}>Medium</option>
                    <option value="HIGH"   style={{ background: "#1e3a5f", color: "#fff" }}>High</option>
                  </select>
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Reward (optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="Amount in $"
                    style={fieldStyle}
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "14px",
                border: "none",
                background: loading ? "#4338ca" : "#4f46e5",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
                marginTop: "4px",
              }}
            >
              {loading ? "Submitting…" : "Submit Report"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
