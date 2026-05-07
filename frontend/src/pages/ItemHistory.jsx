import { useParams, useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, CheckCircle, ShieldAlert, FileText, Info } from "lucide-react";
import { useItems } from "../context/ItemContext";
import { motion } from "framer-motion";
import PageWrapper from "../components/common/PageWrapper";
import { useEffect, useState } from "react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

const getEventIcon = (action) => {
  const text = action.toLowerCase();
  if (text.includes("report") || text.includes("found")) return <FileText size={20} className="text-blue-400" />;
  if (text.includes("claim")) return <ShieldAlert size={20} className="text-orange-400" />;
  if (text.includes("approv") || text.includes("return")) return <CheckCircle size={20} className="text-green-400" />;
  return <Info size={20} className="text-white/60" />;
};

export default function ItemHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getItemById } = useItems();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getItemById(id).then((data) => {
      if (active) { setItem(data); setLoading(false); }
    });
    return () => { active = false; };
  }, [id, getItemById]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">
          <p className="text-xl text-white/60">Loading history…</p>
        </div>
      </PageWrapper>
    );
  }

  if (!item) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">
          <p className="text-xl text-white/60">Item not found</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen px-6 py-14 md:py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden relative">
        {/* Subtle background element */}
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-indigo-300 hover:text-white transition mb-6 text-sm font-semibold"
            >
              <ArrowLeft size={16} /> Back to Details
            </button>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
              Audit Trail
            </h1>
            <p className="text-white/60 text-lg flex items-center gap-2">
              <span className="font-semibold text-white">{item.title}</span> — Complete timeline of actions
            </p>
          </motion.div>

          {/* Timeline Container */}
          <div className="glass rounded-3xl p-6 md:p-10 shadow-2xl relative">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="relative border-l-2 border-indigo-500/30 ml-4 md:ml-6 space-y-10 py-4"
            >
              {item.history.length === 0 ? (
                <p className="text-white/50 text-center pl-4 py-8 italic">No history available for this item.</p>
              ) : (
                item.history.map((event, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="relative pl-8 md:pl-10"
                  >
                    {/* Timeline Node / Icon */}
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="absolute -left-5 md:-left-[22px] top-0.5 bg-slate-900 border-2 border-indigo-500/50 p-1.5 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                      {getEventIcon(event.action || event.message)}
                    </motion.div>

                    {/* Content Card */}
                    <div className="bg-white/5 hover:bg-white/10 transition duration-300 rounded-2xl p-5 border border-white/10 shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-bold text-indigo-100">
                          {event.message || event.action}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full whitespace-nowrap">
                          <Clock size={13} />
                          {event.time}
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-white/70">
                        <p className="mb-1">
                          <span className="text-white/40 uppercase text-xs tracking-wider mr-2">Actor</span>
                          <strong className="text-white">{event.by}</strong>
                        </p>
                        <p>
                          <span className="text-white/40 uppercase text-xs tracking-wider mr-2">Role</span>
                          <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{event.role}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
