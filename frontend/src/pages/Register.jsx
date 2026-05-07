import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await register({ name, email, password });

    if (!result.success) {
      setError(result.message || "Registration failed. Please try again.");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 px-6 relative overflow-hidden">
        <div className="blob blob-2" style={{ opacity: 0.22 }} />
        <div className="blob blob-3" style={{ opacity: 0.18 }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-10 text-white transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:brightness-110"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg mb-4"
            >
              <User size={28} />
            </motion.div>
            <h1 className="text-3xl font-extrabold">Create Account</h1>
            <p className="text-white/60 mt-2 text-sm">Join your campus community</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 mb-6 text-sm overflow-hidden"
            >
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block mb-2 text-sm font-semibold text-white/80">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <User className="text-white/60 group-hover:text-cyan-400 transition-colors duration-300" size={17} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 transition-all duration-300 hover:bg-white/10 hover:border-white/20 focus:bg-white/10 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 relative z-0"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block mb-2 text-sm font-semibold text-white/80">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <Mail className="text-white/60 group-hover:text-cyan-400 transition-colors duration-300" size={17} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 transition-all duration-300 hover:bg-white/10 hover:border-white/20 focus:bg-white/10 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 relative z-0"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block mb-2 text-sm font-semibold text-white/80">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <Lock className="text-white/60 group-hover:text-cyan-400 transition-colors duration-300" size={17} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 transition-all duration-300 hover:bg-white/10 hover:border-white/20 focus:bg-white/10 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 relative z-0"
                />
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button
              custom={3}
              variants={fieldVariants}
              initial="hidden"
              animate="show"
              whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(6,182,212,0.45)" }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg transition"
            >
              Create Account
              <ArrowRight size={18} />
            </motion.button>
          </form>

          <motion.p
            custom={4}
            variants={fieldVariants}
            initial="hidden"
            animate="show"
            className="text-center mt-7 text-white/55 text-sm"
          >
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-cyan-300 hover:text-white transition">
              Sign In
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
