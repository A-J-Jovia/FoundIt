import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Layout
import Navbar from "./components/layout/Navbar";
import SkipToMain from "./components/common/SkipToMain";
import MouseGlow from "./components/ui/MouseGlow";

// Pages
import Home from "./pages/Home";
import UserDashboard from "./pages/UserDashboard";
import LostItems from "./pages/LostItems";
import FoundItems from "./pages/FoundItems";
import ReportItem from "./pages/ReportItem";
import ItemDetails from "./pages/ItemDetails";
import ItemHistory from "./pages/ItemHistory";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MapPage from "./pages/Map";

// Route Protection
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth
import { useAuth } from "./context/AuthContext";

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Home />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* ROOT */}
        <Route path="/" element={<RootRedirect />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* USER ROUTES */}
        <Route
          path="/lost"
          element={
            <ProtectedRoute role="user">
              <LostItems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/found"
          element={
            <ProtectedRoute role="user">
              <FoundItems />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report"
          element={
            <ProtectedRoute role="user">
              <ReportItem />
            </ProtectedRoute>
          }
        />

        <Route
          path="/item/:id"
          element={
            <ProtectedRoute role="user">
              <ItemDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history/:id"
          element={
            <ProtectedRoute role="user">
              <ItemHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute role="user">
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTE */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* MAP ROUTE */}
        <Route
          path="/map"
          element={
            <ProtectedRoute role="user">
              <MapPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SkipToMain />
      <Navbar />
      <MouseGlow />
      <main id="main-content" className="min-h-screen relative z-10">
        <AnimatedRoutes />
      </main>
    </BrowserRouter>
  );
}
