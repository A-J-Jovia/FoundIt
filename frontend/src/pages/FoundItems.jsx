import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ItemCard, { cardVariants } from "../components/cards/ItemCard";
import { useItems } from "../context/ItemContext";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../components/common/PageWrapper";

const STATUS_META = {
  AVAILABLE: { label: "Available to Claim", disabled: false },
  PENDING_VERIFICATION: { label: "Claim Pending", disabled: true },
  RETURNED: { label: "Returned", disabled: true },
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const inputClass = "px-4 py-3 rounded-xl bg-white/60 border border-white/30 text-black placeholder-black/50 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium";

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden animate-pulse border-l-4 border-l-slate-200">
        <div className="h-48 bg-slate-200" />
        <div className="p-5 space-y-3">
          <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
          <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
          <div className="h-6 bg-slate-200 rounded-full w-1/3" />
        </div>
      </div>
      <div className="h-11 bg-white/20 rounded-xl animate-pulse" />
    </div>
  );
}

export default function FoundItems() {
  const navigate = useNavigate();
  const { items, loading, submitClaim, deleteItem, fetchItems } = useItems();
  const { user } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [fromDate, setFromDate] = useState("");

  useEffect(() => {
    fetchItems({ type: "found", keyword, category, location, startDate: fromDate });
  }, [keyword, category, location, fromDate]);

  const results = items;

  const handleClaim = async (item) => {
    if (item.status !== "AVAILABLE") return;
    const result = await submitClaim(item._id);
    if (result.success) {
      alert("Claim submitted. Admin verification in progress.");
    } else {
      alert(result.message || "Failed to submit claim.");
    }
  };

  const handleDelete = async (itemId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const result = await deleteItem(itemId);
    if (result.success) {
      alert("Item deleted successfully.");
    } else {
      alert(result.message || "Failed to delete item.");
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen px-8 pt-6 pb-16 text-white relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Found Items</h1>
          <p className="font-medium text-slate-300 text-lg">Items found on campus and reported by users or staff.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid md:grid-cols-4 gap-4 mb-10 glass rounded-3xl p-6 shadow-sm max-w-5xl mx-auto backdrop-blur-3xl">
          <div className="relative">
            <Search className="absolute top-3.5 left-3.5 text-black" size={17} />
            <input type="text" placeholder="Search by keyword..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className={`w-full pl-10 pr-4 ${inputClass}`} />
          </div>
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </motion.div>
            ) : results.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-8">
                  <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                    <circle cx="100" cy="100" r="90" fill="#EEF2FF" />
                    <rect x="60" y="70" width="80" height="60" rx="12" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="4" />
                    <circle cx="100" cy="100" r="16" fill="#818CF8" />
                    <path d="M112 112L128 128" stroke="#818CF8" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="140" cy="60" r="12" fill="#34D399" opacity="0.8" />
                    <rect x="40" y="140" width="24" height="24" rx="6" fill="#F472B6" opacity="0.8" transform="rotate(-15 40 140)" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-3">No Found Items</h3>
                <p className="text-slate-300 font-medium max-w-md mx-auto mb-8">We couldn't locate any found items matching your search. Why not report an item you've found?</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/report")} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-colors hover:bg-indigo-700">
                  Report an Item
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="grid" variants={gridVariants} initial="hidden" animate="show" exit="hidden" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((item) => {
                  const meta = STATUS_META[item.status] ?? STATUS_META.AVAILABLE;
                  return (
                    <motion.div key={item._id} variants={cardVariants} className="space-y-3">
                      <div onClick={() => navigate(`/item/${item._id}`)} className="cursor-pointer">
                        <ItemCard item={item} />
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          disabled={meta.disabled}
                          whileHover={!meta.disabled ? { scale: 1.05 } : {}}
                          whileTap={!meta.disabled ? { scale: 0.95 } : {}}
                          onClick={() => handleClaim(item)}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 ${meta.disabled ? "bg-white/20 text-black cursor-not-allowed border-2 border-white/20" : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500/50 shadow-md border-2 border-transparent"}`}
                        >
                          {meta.disabled ? meta.label : "Claim Item"}
                        </motion.button>
                        {user?.role === "admin" && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => handleDelete(item._id, e)} className="px-4 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-all border-2 border-rose-500/20" title="Delete item">
                            <Trash2 size={18} />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  );
}
