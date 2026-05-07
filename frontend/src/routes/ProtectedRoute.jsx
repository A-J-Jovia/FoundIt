import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * - If not logged in → redirect to /login
 * - If route requires admin and user is not admin → redirect to /
 * - Admins ARE allowed to access user routes
 */
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isAdmin } = useAuth();

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route protection
  if (role === "admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Allowed
  return children;
}
