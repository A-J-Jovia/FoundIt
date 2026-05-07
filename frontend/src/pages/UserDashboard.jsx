import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useItems } from "../context/ItemContext";
import { ArrowRight, Search, Package, Clock, ShieldCheck, Sparkles, MapPin, CheckCircle2, Send, Bot } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { aiAPI } from "../services/api";
import PageWrapper from "../components/common/PageWrapper";

const STATUS_META = {
  AVAILABLE: {
    label: "Available",
    tone: "from-primary-100 via-secondary-100 to-accent-100",
    description: "This item is open for matching or a claim.",
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    tone: "from-amber-100 via-amber-200 to-amber-300",
    description: "A claim has been submitted and awaits review.",
  },
  UNDER_VERIFICATION: {
    label: "Under Verification",
    tone: "from-amber-200 via-amber-300 to-amber-400",
    description: "The claim flow is being validated by campus staff.",
  },
  RETURNED: {
    label: "Returned",
    tone: "from-slate-100 via-slate-200 to-slate-300",
    description: "This item has been successfully returned.",
  },
};

const ACTION_PANELS = [
  { key: "overview", label: "Overview",      icon: <Sparkles   size={18} />, description: "A living summary of your campus recovery activity." },
  { key: "search",   label: "Search Items",  icon: <Search     size={18} />, description: "Filter your lost or found items instantly." },
  { key: "claims",   label: "Track Claims",  icon: <ShieldCheck size={18} />, description: "Monitor claim progress and open review items." },
  { key: "activity", label: "My Activity",   icon: <Clock      size={18} />, description: "View your most recent actions and history." },
];

const CATEGORIES = ["Electronics", "Stationery", "Keys", "Clothing", "Accessories", "Documents", "Other"];
const ITEM_TYPES = [
  { value: "lost",  label: "Lost" },
  { value: "found", label: "Found" },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const { items, searchItems } = useItems();
  const navigate = useNavigate();

  const [activePanel,    setActivePanel]    = useState("overview");
  const [panelUsage,     setPanelUsage]     = useState({ overview: 1, search: 0, claims: 0, activity: 0 });
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [filterState,    setFilterState]    = useState({ keyword: "", category: "", location: "", type: "" });

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const reportedItems      = useMemo(() => items.filter((item) => item.createdBy?._id === user._id || item.createdBy === user._id), [items, user._id]);
  const claimedItems       = useMemo(() => items.filter((item) => item.claimant?._id === user._id),          [items, user._id]);
  const pendingClaims      = useMemo(() => items.filter((item) => item.status === "PENDING_VERIFICATION"),   [items]);
  const returnedItems      = useMemo(() => items.filter((item) => item.status === "RETURNED"),               [items]);
  const activeVerifications= useMemo(() => items.filter((item) => item.status === "UNDER_VERIFICATION"),     [items]);
  const recentlyViewedItems= useMemo(() => items.filter((item) => recentlyViewed.includes(item._id)),        [items, recentlyViewed]);
  const searchResults      = useMemo(() => searchItems(filterState),                                         [filterState, searchItems]);

  const panelOrder = useMemo(() =>
    ACTION_PANELS.slice().sort((a, b) => (panelUsage[b.key] || 0) - (panelUsage[a.key] || 0)),
    [panelUsage]
  );

  const summaries = [
    { label: "Reports",       value: reportedItems.length,       icon: <Package    size={22} />, tone: "from-primary-100 to-secondary-100" },
    { label: "Claims",        value: pendingClaims.length,       icon: <ShieldCheck size={22} />, tone: "from-amber-100 to-amber-200" },
    { label: "Matches",       value: returnedItems.length,       icon: <CheckCircle2 size={22} />, tone: "from-slate-100 to-slate-200" },
    { label: "Verifications", value: activeVerifications.length, icon: <Clock      size={22} />, tone: "from-indigo-100 to-accent-100" },
  ];

  const handlePanelChange = (panelKey) => {
    setActivePanel(panelKey);
    setPanelUsage((prev) => ({ ...prev, [panelKey]: (prev[panelKey] || 0) + 1 }));
  };

  const handleExpandItem = (itemId) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    if (!recentlyViewed.includes(itemId)) {
      setRecentlyViewed((prev) => [itemId, ...prev].slice(0, 6));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    const newHistory = [...chatMessages, { role: 'user', text: userMessage }];
    setChatMessages(newHistory);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const payload = {
        message: userMessage,
        history: chatMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        userName: user.name,
        userRole: user.role,
        reportedCount: reportedItems.length,
        claimedCount: claimedItems.length,
        pendingClaimsCount: pendingClaims.length,
        activeVerificationsCount: activeVerifications.length,
        returnedCount: returnedItems.length,
        recentItemTitles: recentlyViewedItems.map(i => i.title),
      };
      
      const { data } = await aiAPI.chat(payload);
      setChatMessages([...newHistory, { role: 'model', text: data.reply }]);
    } catch (err) {
      setChatMessages([...newHistory, { 
        role: 'model', 
        text: err.response?.data?.message || 'Sorry, I encountered an error connecting to the AI.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Shared inline styles — same approach as ReportItem.jsx to bypass global CSS overrides
  const fieldStyle = {
    width: "100%",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
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

  const optStyle = { background: "#1e3a5f", color: "#fff" };

  return (
    <PageWrapper>
      <div className="min-h-screen px-4 pt-6 pb-10 sm:px-6 lg:px-10 text-white">
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">

          {/* ── LEFT SIDEBAR ── */}
          <div className="glass rounded-[32px] border-white/70 p-6 shadow-glass">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Welcome back</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">{user.name}</h1>
              <p className="mt-3 text-slate-300 leading-7">Your campus lost and found hub. Track reports, claims, and high-priority matches from one workspace.</p>
            </motion.div>

            {/* Summary cards */}
            <div className="mt-8 grid gap-4">
              {summaries.map((summary, index) => (
                <motion.div key={summary.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * index, duration: 0.45 }} className="glass rounded-3xl border-white/20 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">{summary.label}</p>
                      <p className="mt-3 text-3xl font-black text-white">{summary.value}</p>
                    </div>
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${summary.tone} text-slate-900`}>
                      {summary.icon}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Smart Alerts */}
            <div className="mt-8 space-y-4">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="glass rounded-[28px] border-white/20 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-300 uppercase tracking-[0.24em]">Smart Alerts</p>
                    <h2 className="mt-3 text-xl font-black text-white">{pendingClaims.length ? `${pendingClaims.length} claim${pendingClaims.length === 1 ? "" : "s"} waiting review` : "No urgent actions"}</h2>
                    <p className="mt-2 text-slate-300">{pendingClaims.length ? "Campus staff may need to review these items for secure handover." : "Your dashboard is clear — keep up the smooth workflows."}</p>
                  </div>
                  <div className="rounded-3xl border border-blue-400/30 bg-blue-500/20 px-4 py-3 text-sm font-semibold text-blue-200">{activeVerifications.length} active</div>
                </div>
              </motion.div>

              {/* Frequently used */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.24 }} className="glass rounded-[28px] border-white/20 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-300 uppercase tracking-[0.24em]">Frequently used</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {panelOrder.map((action) => (
                    <motion.button
                      key={action.key}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePanelChange(action.key)}
                      className={`flex min-w-[130px] items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        activePanel === action.key
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white/15 text-white border-white/20 hover:bg-white/25"
                      }`}
                    >
                      {action.icon}
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="glass rounded-[32px] border-white/20 p-6 shadow-glass">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Dashboard</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Adaptive recovery workspace</h2>
                </div>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm text-slate-300 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live updates enabled
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {/* Recently viewed */}
                <div className="glass rounded-[28px] border-white/20 p-5">
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-[0.2em]">Recently viewed</p>
                  <p className="mt-3 text-slate-300 text-sm">Items you opened most recently stay ready for fast access.</p>
                  <div className="mt-5 space-y-3">
                    {recentlyViewedItems.length ? recentlyViewedItems.map((item) => (
                      <button key={item._id} onClick={() => handleExpandItem(item._id)} className="w-full rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-left transition hover:bg-white/20">
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{item.location || "No location"}</p>
                      </button>
                    )) : (
                      <p className="text-sm text-slate-400">Open any card to build your recent view list.</p>
                    )}
                  </div>
                </div>

                {/* Pending roundup */}
                <div className="glass rounded-[28px] border-white/20 p-5">
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-[0.2em]">Pending roundup</p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4">
                      <p className="text-sm font-semibold text-slate-300">Claim reviews</p>
                      <p className="mt-1 text-3xl font-black text-white">{pendingClaims.length}</p>
                    </div>
                    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                      <p className="text-sm font-semibold text-slate-300">Your reports</p>
                      <p className="mt-1 text-3xl font-black text-white">{reportedItems.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Panel content */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.14 }} className="glass rounded-[32px] border-white/20 p-6 shadow-glass">
              {activePanel === "overview" ? (
                <div className="flex flex-col h-[400px]">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Campus AI Assistant</h3>
                      <p className="text-xs text-slate-400">Ask about your stats, hotspots, or how to use the dashboard</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {chatMessages.length === 0 && (
                      <div className="flex h-full flex-col items-center justify-center text-slate-400 space-y-2">
                        <Bot size={32} className="opacity-50" />
                        <p className="text-sm">Hi! I can help you find items or understand your activity.</p>
                      </div>
                    )}
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 border border-white/10 rounded-bl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-none bg-white/10 px-4 py-3 border border-white/10 flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask me anything..."
                      disabled={isChatLoading}
                      className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white/20"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-50 shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-white/20 bg-white/10 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Quick action</p>
                      <p className="mt-3 text-lg font-black text-white">{ACTION_PANELS.find((p) => p.key === activePanel)?.label}</p>
                      <p className="mt-2 text-slate-300">{ACTION_PANELS.find((p) => p.key === activePanel)?.description}</p>
                    </div>

                    {activePanel === "search" && (
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <label style={labelStyle}>Keyword</label>
                            <input
                              placeholder="Title or category"
                              value={filterState.keyword}
                              onChange={(e) => setFilterState((prev) => ({ ...prev, keyword: e.target.value }))}
                              style={fieldStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Location</label>
                            <input
                              placeholder="Building, area…"
                              value={filterState.location}
                              onChange={(e) => setFilterState((prev) => ({ ...prev, location: e.target.value }))}
                              style={fieldStyle}
                            />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <label style={labelStyle}>Type</label>
                            <select
                              value={filterState.type}
                              onChange={(e) => setFilterState((prev) => ({ ...prev, type: e.target.value }))}
                              style={fieldStyle}
                            >
                              <option value="" style={optStyle}>All types</option>
                              {ITEM_TYPES.map((t) => <option key={t.value} value={t.value} style={optStyle}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Category</label>
                            <select
                              value={filterState.category}
                              onChange={(e) => setFilterState((prev) => ({ ...prev, category: e.target.value }))}
                              style={fieldStyle}
                            >
                              <option value="" style={optStyle}>All categories</option>
                              {CATEGORIES.map((c) => <option key={c} value={c} style={optStyle}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", fontSize: "13px", color: "#cbd5e1" }}>
                          {searchResults.length} matching item{searchResults.length === 1 ? "" : "s"} found.
                        </div>
                      </motion.div>
                    )}

                    {activePanel === "claims" && (
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)" }}>
                          <p style={{ ...labelStyle, marginBottom: "4px" }}>Pending claims</p>
                          <p style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", margin: 0 }}>{pendingClaims.length}</p>
                        </div>
                        <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)" }}>
                          <p style={{ ...labelStyle, marginBottom: "4px" }}>Active verifications</p>
                          <p style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", margin: 0 }}>{activeVerifications.length}</p>
                        </div>
                        {pendingClaims.length === 0 && (
                          <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>No pending claims at the moment.</p>
                        )}
                      </motion.div>
                    )}

                    {activePanel === "activity" && (
                      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.1)" }}>
                          <p style={{ ...labelStyle, marginBottom: "4px" }}>Your reports</p>
                          <p style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", margin: 0 }}>{reportedItems.length}</p>
                        </div>
                        <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.1)" }}>
                          <p style={{ ...labelStyle, marginBottom: "4px" }}>Claims submitted</p>
                          <p style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", margin: 0 }}>{claimedItems.length}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[32px] border border-white/20 bg-white/10 p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Current flow</p>
                          <h3 className="mt-3 text-2xl font-black text-white">
                            {activePanel === "search" ? "Search tiles" : activePanel === "claims" ? "Claims radar" : activePanel === "activity" ? "Activity log" : "Overview"}
                          </h3>
                        </div>
                        <div className="inline-flex items-center rounded-full bg-indigo-500/20 px-3 py-2 text-xs font-bold text-indigo-300">Adaptive UI</div>
                      </div>
                      <p className="mt-4 text-slate-300">The dashboard adjusts to focus on the area you tapped most.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Item cards */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.18 }} className="space-y-4">
              {activePanel === "search" ? (
                searchResults.map((item) => (
                  <MorphicItemCard key={item._id} item={item} expanded={expandedItemId === item._id} onToggle={() => handleExpandItem(item._id)} />
                ))
              ) : (
                <div className="grid gap-4">
                  {reportedItems.length ? reportedItems.slice(0, 4).map((item) => (
                    <MorphicItemCard key={item._id} item={item} expanded={expandedItemId === item._id} onToggle={() => handleExpandItem(item._id)} />
                  )) : (
                    <div className="glass rounded-[32px] border-white/20 p-8 text-center text-slate-300">You don't have any reported items yet.</div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function MorphicItemCard({ item, expanded, onToggle }) {
  const status = STATUS_META[item.status] || STATUS_META.AVAILABLE;
  const statusOrder = ["AVAILABLE", "PENDING_VERIFICATION", "UNDER_VERIFICATION", "RETURNED"];
  const currentIndex = statusOrder.indexOf(item.status);

  return (
    <motion.article layout className="glass rounded-[32px] border-white/20 shadow-glass overflow-hidden transition-all hover:-translate-y-0.5">
      <motion.button layoutId={`card-${item._id}`} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 320, damping: 24 }} onClick={onToggle} className="w-full text-left">
        <div className="grid gap-5 px-6 py-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">{item.category || "General"}</p>
            <h3 className="mt-3 text-2xl font-black text-white">{item.title || "Untitled item"}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{item.description?.marks || item.description?.condition || "Tap to expand for more details."}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><MapPin size={14} /> {item.location || "Unknown location"}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><Clock size={14} /> {item.date ? new Date(item.date).toLocaleDateString() : "No date"}</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
              {status.label}
            </span>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-white/10 px-4 py-3 shadow-sm text-slate-300">
              <ArrowRight size={16} /> {expanded ? "Collapse card" : "Expand details"}
            </div>
          </div>
        </div>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} className="border-t border-white/10 bg-white/5 px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/20 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Type</p>
                    <p className="mt-2 font-semibold text-white">{item.type || "lost"}</p>
                  </div>
                  <div className="rounded-3xl border border-white/20 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Reported by</p>
                    <p className="mt-2 font-semibold text-white">{item.createdBy?.name || "Campus user"}</p>
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/20 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Claim timeline</p>
                  <div className="mt-4 space-y-3">
                    {statusOrder.map((statusKey, index) => {
                      const step = STATUS_META[statusKey] || { label: statusKey };
                      const active = index <= currentIndex;
                      return (
                        <div key={statusKey} className="flex items-center gap-3">
                          <span className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-bold ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white/10 text-slate-400 border-white/20"}`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className={`text-sm font-semibold ${active ? "text-white" : "text-slate-400"}`}>{step.label}</p>
                            <p className="text-xs text-slate-500">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/20 bg-black/30 p-4 shadow-lg overflow-hidden">
                  {item.imageURL ? (
                    <img src={item.imageURL} alt={item.title} className="h-48 w-full object-cover rounded-2xl" />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-2xl text-slate-400 text-sm">No image available</div>
                  )}
                </div>
                <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Secure QR preview</p>
                  <div className="mt-4 inline-flex rounded-2xl bg-white p-3">
                    <QRCodeSVG value={item._id || item.title || "CampusLostFound"} size={100} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
