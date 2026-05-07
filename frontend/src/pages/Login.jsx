import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PageWrapper from "../components/common/PageWrapper";

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  show: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await login({ email, password });

    if (!result.success) {
      setError(result.message || "Login failed. Please try again.");
      return;
    }

    if (result.role === "admin") navigate("/admin");
    else navigate("/dashboard");
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="blob blob-1" style={{ opacity: 0.25 }} />
        <div className="blob blob-2" style={{ opacity: 0.2 }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-10 text-white transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:brightness-110"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4"
            >
              <Lock size={28} />
            </motion.div>
            <h1 className="text-3xl font-extrabold">Welcome Back</h1>
            <p className="text-white/60 mt-2 text-sm">Sign in to your campus account</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 mb-6 text-sm overflow-hidden"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block mb-2 text-sm font-semibold text-white/80">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <Mail className="text-white/60 group-hover:text-indigo-400 transition-colors duration-300" size={17} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 transition-all duration-300 hover:bg-white/10 hover:border-white/20 focus:bg-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 relative z-0"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block mb-2 text-sm font-semibold text-white/80">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <Lock className="text-white/60 group-hover:text-indigo-400 transition-colors duration-300" size={17} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 transition-all duration-300 hover:bg-white/10 hover:border-white/20 focus:bg-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 relative z-0"
                />
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button
              custom={2}
              variants={fieldVariants}
              initial="hidden"
              animate="show"
              whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3.5 rounded-2xl shadow-lg transition"
            >
              Sign In
              <ArrowRight size={18} />
            </motion.button>
          </form>

          <motion.p
            custom={3}
            variants={fieldVariants}
            initial="hidden"
            animate="show"
            className="text-center mt-7 text-white/55 text-sm"
          >
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-indigo-300 hover:text-white transition">
              Register
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
