import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Save, Pencil, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageWrapper from "../components/common/PageWrapper";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const result = await updateProfile({ name, email });
    setSaving(false);
    if (result.success) {
      setIsEditing(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen px-6 py-14 flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="blob blob-1 bg-indigo-500/10" />
        <div className="blob blob-3 bg-purple-500/10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:brightness-110"
        >
          {/* Avatar Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-6">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-xl opacity-40"
              />
              <div className="relative bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 rounded-full">
                <div className="bg-slate-900 rounded-full p-5">
                  <User size={48} className="text-indigo-200" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              {user.name}
            </h1>
            <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/70 border border-white/10">
              <Shield size={12} /> {user.role === "admin" ? "Campus Administrator" : "Student"}
            </span>
          </div>

          <form className="space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/40 text-sm text-red-300">
                {error}
              </div>
            )}
            {/* NAME */}
            <motion.div
              initial={false}
              animate={{ opacity: isEditing ? 1 : 0.7 }}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-white/80 pl-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <User className={`transition-colors duration-300 ${isEditing ? 'text-indigo-400' : 'text-white/60 group-hover:text-indigo-400'}`} size={18} />
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300 outline-none relative z-0
                    ${isEditing
                      ? "bg-white/10 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-white focus:ring-2 focus:ring-indigo-500/40"
                      : "bg-white/5 border border-white/5 text-white/70 cursor-not-allowed hover:bg-white/10 hover:border-white/20"
                    }`}
                />
              </div>
            </motion.div>

            {/* EMAIL */}
            <motion.div
              initial={false}
              animate={{ opacity: isEditing ? 1 : 0.7 }}
              className="space-y-2"
            >
              <label className="text-sm font-semibold text-white/80 pl-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none z-10">
                  <Mail className={`transition-colors duration-300 ${isEditing ? 'text-purple-400' : 'text-white/60 group-hover:text-purple-400'}`} size={18} />
                </div>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300 outline-none relative z-0
                    ${isEditing
                      ? "bg-white/10 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] text-white focus:ring-2 focus:ring-purple-500/40"
                      : "bg-white/5 border border-white/5 text-white/70 cursor-not-allowed hover:bg-white/10 hover:border-white/20"
                    }`}
                />
              </div>
            </motion.div>

            {/* ACTION BUTTONS (AnimatePresence) */}
            <div className="pt-6 border-t border-white/10">
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.button
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                    className="w-full flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl font-bold transition-colors"
                  >
                    <Pencil size={18} /> Edit Profile
                  </motion.button>
                ) : (
                  <motion.div
                    key="save"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(user.name);
                        setEmail(user.email);
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 py-3.5 rounded-xl font-bold transition-colors text-white/70 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-[2] flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow disabled:opacity-60"
                    >
                      <Save size={18} /> {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
