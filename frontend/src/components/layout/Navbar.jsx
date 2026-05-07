import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Package,
  PackageSearch,
  PlusCircle,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Map,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { to: "/", icon: <Home size={17} />, label: "Home" },
    ...(isAuthenticated
      ? [
          { to: "/lost", icon: <Search size={17} />, label: "Lost" },
          { to: "/found", icon: <Package size={17} />, label: "Found" },
          { to: "/report", icon: <PlusCircle size={17} />, label: "Report" },
          { to: "/map", icon: <Map size={17} />, label: "Map" },
          { to: "/profile", icon: <User size={17} />, label: "Profile" },
        ]
      : []),
    ...(isAdmin ? [{ to: "/admin", icon: <Shield size={17} />, label: "Admin" }] : []),
  ];

  return (
    <>
      <motion.nav
        animate={{
          paddingTop: scrolled ? "10px" : "16px",
          paddingBottom: scrolled ? "10px" : "16px",
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="sticky top-0 left-0 w-full z-50 border-b border-white/10 bg-[rgba(15,23,42,0.85)] backdrop-blur-xl shadow-glass px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 py-1">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              navigate("/");
              setMenuOpen(false);
            }}
          >
            <div className="w-11 h-11 rounded-3xl bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-blue-200 shadow-sm">
              <PackageSearch size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-300">Campus Lost & Found</p>
              <p className="text-lg font-black text-white tracking-tight">Recovery HQ</p>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-3">
            {navLinks.map((link) => (
              <NavItem key={link.to} to={link.to} icon={link.icon} label={link.label} />
            ))}

            {!isAuthenticated ? (
              <NavItem to="/login" icon={<User size={17} />} label="Login" />
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 text-blue-200 border border-blue-700/50 transition hover:bg-blue-800/60 hover:text-white text-sm font-semibold"
              >
                <LogOut size={16} />
                Logout
              </motion.button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-2xl bg-blue-900/50 border border-blue-700/50 text-blue-200"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-0 top-[76px] z-40 bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-2 text-white font-medium">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavLink
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${isActive ? "bg-white/15" : "hover:bg-white/10"}`
                    }
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </NavLink>
                </motion.div>
              ))}

              {!isAuthenticated ? (
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: navLinks.length * 0.05 }}>
                  <NavLink
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/10 transition"
                  >
                    <User size={17} /> Login
                  </NavLink>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-red-500/20 hover:bg-red-500/30 transition"
                >
                  <LogOut size={17} /> Logout
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? "text-blue-300" : "text-blue-100/80 hover:text-white hover:bg-white/10"}`
      }
    >
      {({ isActive }) => (
        <>
          {icon}
          <span>{label}</span>
          {isActive && (
            <motion.span
              layoutId="nav-active-pill"
              className="absolute inset-0 rounded-full bg-blue-500/20 border border-blue-400/30 -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}
