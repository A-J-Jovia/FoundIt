import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useItems } from "../context/ItemContext";
import { Package, Clock, ShieldCheck, CheckCircle2, AlertTriangle, Eye, Zap } from "lucide-react";
import PageWrapper from "../components/common/PageWrapper";

const STATUS_META = {
  AVAILABLE: { label: "Available", color: "bg-primary-50 text-primary-700 border-primary-100" },
  PENDING_VERIFICATION: { label: "Pending Verification", color: "bg-amber-50 text-amber-700 border-amber-100" },
  UNDER_VERIFICATION: { label: "Under Verification", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  RETURNED: { label: "Returned", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const ADMIN_ACTIONS = [
  { key: "overview", label: "Overview", icon: <Zap size={18} /> },
  { key: "claims", label: "Claims", icon: <ShieldCheck size={18} /> },
  { key: "reviews", label: "Reviews", icon: <Eye size={18} /> },
];

export default function AdminDashboard() {
  const { items, startVerification, decideClaim } = useItems();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("overview");
  const [verificationMethod, setVerificationMethod] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);

  const pendingClaims = useMemo(() => items.filter((item) => item.status === "PENDING_VERIFICATION"), [items]);
  const underVerification = useMemo(() => items.filter((item) => item.status === "UNDER_VERIFICATION"), [items]);
  const returnedItems = useMemo(() => items.filter((item) => item.status === "RETURNED"), [items]);
  const highRiskItems = useMemo(() => items.filter((item) => ["Electronics", "Documents", "Accessories", "Keys"].includes(item.category)), [items]);
  const selectedItem = useMemo(() => items.find((item) => item._id === selectedItemId), [items, selectedItemId]);

  const stats = [
    { label: "Total Items", value: items.length, icon: <Package size={22} />, accent: "from-primary-100 to-accent-100" },
    { label: "Claims Pending", value: pendingClaims.length, icon: <ShieldCheck size={22} />, accent: "from-amber-100 to-amber-200" },
    { label: "Under Review", value: underVerification.length, icon: <Clock size={22} />, accent: "from-indigo-100 to-indigo-200" },
    { label: "Returned", value: returnedItems.length, icon: <CheckCircle2 size={22} />, accent: "from-secondary-100 to-secondary-200" },
  ];

  const handlePanelChange = (key) => {
    setActivePanel(key);
  };

  const handleDecision = async (itemId, approved) => {
    if (!verificationMethod || (!approved && !adminNotes)) {
      alert("Please provide a verification method and notes.");
      return;
    }

    await decideClaim({ itemId, approved, verificationMethod, notes: adminNotes });
    setVerificationMethod("");
    setAdminNotes("");
  };

  return (
    <PageWrapper>
      <div className="min-h-screen px-4 pt-6 pb-10 sm:px-6 lg:px-10 text-white">
        <div className="glass rounded-[32px] border-white/70 p-6 shadow-glass">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin dashboard</p>
              <h1 className="mt-3 text-4xl font-black text-slate-900">Campus recovery operations</h1>
              <p className="mt-3 max-w-2xl text-slate-600 leading-7">Assist claim workflows, verify handovers, and monitor high-risk items within the campus community.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
              {ADMIN_ACTIONS.map((action) => (
                <button key={action.key} onClick={() => handlePanelChange(action.key)} className={`flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition ${activePanel === action.key ? "bg-primary-100 text-slate-900 border-primary-200 shadow-glow" : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white"}`}>
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <div className="glass rounded-[32px] border-white/70 p-5 shadow-glass">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Operational snapshot</p>
              <div className="mt-6 grid gap-4">
                {stats.map((stat) => (
                  <motion.div key={stat.label} whileHover={{ y: -2 }} className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
                        <p className="mt-3 text-3xl font-black text-slate-900">{stat.value}</p>
                      </div>
                      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${stat.accent} text-slate-900`}>{stat.icon}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[32px] border-white/70 p-5 shadow-glass">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">High risk alerts</p>
              <div className="mt-5 space-y-4">
                {highRiskItems.length ? highRiskItems.slice(0, 3).map((item) => (
                  <div key={item._id} className="rounded-3xl border border-rose-100 bg-rose-50/80 p-4">
                    <p className="text-sm font-bold text-rose-700">{item.title}</p>
                    <p className="mt-1 text-sm text-rose-600">{item.category} — {item.location || "No location"}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No high-risk items detected in the current set.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-[32px] border-white/70 p-6 shadow-glass">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{activePanel === "overview" ? "Action board" : activePanel === "claims" ? "Claims queue" : "Verification review"}</p>
              <div className="mt-5 grid gap-4">
                {activePanel === "overview" && (
                  <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                    <p className="text-lg font-black text-slate-900">Keep workflows moving</p>
                    <p className="mt-3 text-slate-600">Select an item from the list below to inspect detail, start verification, or approve a return.</p>
                  </div>
                )}

                {activePanel === "claims" && pendingClaims.length === 0 && (
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-slate-600">No pending claims at the moment. The dashboard will highlight new claim requests as they arrive.</div>
                )}

                {activePanel === "reviews" && underVerification.length === 0 && (
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-slate-600">No items are currently under verification. Refresh to see newly escalated claims.</div>
                )}

                <div className="grid gap-4">
                  {(activePanel === "overview" ? pendingClaims : activePanel === "claims" ? pendingClaims : underVerification).map((item) => (
                    <motion.div key={item._id} whileHover={{ y: -2 }} className="glass rounded-[28px] border border-slate-200 p-5 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.category} — {item.location || "Campus"}</p>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${STATUS_META[item.status]?.color || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {STATUS_META[item.status]?.label || item.status}
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button onClick={() => setSelectedItemId(item._id)} className="rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-primary-200">Inspect</button>
                        {item.status === "PENDING_VERIFICATION" && (
                          <button onClick={() => startVerification(item._id, "Admin review")} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Start verification</button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {selectedItem && (
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="glass rounded-[32px] border-white/70 p-6 shadow-glass">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Selected item</p>
                      <h2 className="text-3xl font-black text-slate-900">{selectedItem.title}</h2>
                      <p className="text-slate-600">{selectedItem.description?.marks || selectedItem.description?.condition || "Details available when an item is selected."}</p>
                    </div>
                    <button onClick={() => setSelectedItemId(null)} className="rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700">Dismiss</button>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Verification method</p>
                      <select value={verificationMethod} onChange={(e) => setVerificationMethod(e.target.value)} className="mt-3 w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-400 focus:outline-none">
                        <option value="">Select method</option>
                        <option value="ID Match">ID Match</option>
                        <option value="Description Match">Description Match</option>
                        <option value="Security Approval">Security Approval</option>
                      </select>
                    </div>
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Admin notes</p>
                      <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={5} className="mt-3 w-full resize-none rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-400 focus:outline-none" placeholder="Add information for the claimant or staff."></textarea>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button onClick={() => handleDecision(selectedItem._id, true)} className="btn-primary w-full sm:w-auto">Approve claim</button>
                    <button onClick={() => handleDecision(selectedItem._id, false)} className="rounded-full border border-slate-300 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400">Reject claim</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
