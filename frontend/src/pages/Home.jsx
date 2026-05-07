import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { statsAPI } from "../services/api";
import {
  Search,
  Package,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import PageWrapper from "../components/common/PageWrapper";

const features = [
  {
    icon: <Search size={28} />,
    title: "Report Lost Items",
    description:
      "Quickly report any item you've lost on campus. Upload a photo, describe it, and add the location.",
    color: "from-indigo-500 to-purple-600",
    action: "/report",
    cta: "Report Now",
  },
  {
    icon: <Package size={28} />,
    title: "Browse Found Items",
    description:
      "Check the found items board. If you spot yours, submit a claim and start the verification process.",
    color: "from-cyan-500 to-blue-600",
    action: "/found",
    cta: "Browse Items",
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Secure Verification",
    description:
      "Every claim goes through admin review — ID checks, description matching, and security approval.",
    color: "from-emerald-500 to-teal-600",
    action: "/login",
    cta: "Learn More",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [stats, setStats] = useState([
    { icon: <Package size={22} />, value: "—", label: "Items Recovered" },
    { icon: <Clock size={22} />, value: "—", label: "Avg. Resolution" },
    { icon: <Users size={22} />, value: "—", label: "Campus Users" },
    { icon: <MapPin size={22} />, value: "—", label: "Campus Zones Covered" },
  ]);

  useEffect(() => {
    statsAPI.getPublic().then(({ data }) => {
      setStats([
        { icon: <Package size={22} />, value: String(data.returnedCount), label: "Items Recovered" },
        {
          icon: <Clock size={22} />,
          value: data.avgResolutionHours != null ? `${data.avgResolutionHours}h` : "N/A",
          label: "Avg. Resolution",
        },
        { icon: <Users size={22} />, value: String(data.userCount), label: "Campus Users" },
        { icon: <MapPin size={22} />, value: String(data.locationCount), label: "Campus Zones Covered" },
      ]);
    }).catch(() => {
      // leave placeholder dashes if API is unreachable
    });
  }, []);

  const handleReport = () => navigate(isAuthenticated ? "/report" : "/login");
  const handleBrowse = () => navigate(isAuthenticated ? "/found" : "/login");

  return (
    <PageWrapper>
      <div className="text-white relative z-10 overflow-hidden">

        {/* ── HERO ── */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-12 pb-10 overflow-hidden">

          {/* Clean animated blobs in light mode */}
          <div className="blob blob-1 opacity-20" style={{ background: '#e0e7ff' }} />
          <div className="blob blob-2 opacity-20" style={{ background: '#fce7f3' }} />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.3]"
            style={{
              backgroundImage:
                "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass font-semibold text-indigo-700 mb-8 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Campus Lost & Found Platform — Live
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight text-white"
            >
              Find What{" "}
              <span className="text-indigo-600">
                Matters
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-medium"
            >
              A smart campus platform to report, track, and recover lost items —
              faster, safer, and stress-free.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleReport}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-[0_0_20px_rgba(199,210,254,0.8)]"
              >
                Report Lost Item
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBrowse}
                className="glass px-8 py-4 rounded-2xl font-bold hover:bg-white/20 text-white transition shadow-sm text-base"
              >
                Browse Found Items
              </motion.button>
            </motion.div>


          </div>
        </section>

        {/* ── FEATURE CARDS ── */}
        <section className="py-12 px-6 backdrop-blur-2xl bg-white/5 border-y border-white/10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">
                How It{" "}
                <span className="text-indigo-600">
                  Works
                </span>
              </h2>
              <p className="text-slate-300 text-lg font-medium max-w-2xl mx-auto">
                Three simple steps to reunite you with your belongings
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="relative glass rounded-3xl p-8 cursor-pointer group shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:bg-white/60 transition-colors"
                  onClick={() => navigate(f.action)}
                >
                  {/* Step number */}
                  <span className="absolute top-6 right-6 text-6xl font-black text-slate-50 select-none">
                    {i + 1}
                  </span>

                  <div
                    className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${f.color} mb-6 shadow-sm text-white`}
                  >
                    {f.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-slate-300 font-medium text-sm leading-relaxed mb-6">
                    {f.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:text-indigo-700 transition">
                    {f.cta}
                    <motion.span
                      animate={{ x: 0 }}
                      whileHover={{ x: 4 }}
                      className="group-hover:translate-x-1 transition-transform"
                    >
                      <ArrowRight size={16} />
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="py-12 px-6 bg-white/5 backdrop-blur-3xl border-y border-white/10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center"
            >
              {stats.map((s) => (
                <motion.div
                  key={s.label}
                  variants={cardVariants}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-500 mb-2">{s.icon}</div>
                  <p className="text-4xl font-black text-white">
                    {s.value}
                  </p>
                  <p className="text-slate-300 text-sm font-bold">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA FOOTER ── */}
        <section className="py-16 px-6 bg-white/5 text-center border-t border-white/10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Ready to get{" "}
              <span className="text-indigo-600">
                started?
              </span>
            </h2>
            <p className="text-slate-300 font-medium text-lg mb-10 leading-relaxed">
              Join your campus community and make lost items a thing of the past.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(199,210,254,0.8)]"
            >
              {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
            </motion.button>
          </motion.div>
        </section>
      </div>
    </PageWrapper>
  );
}
