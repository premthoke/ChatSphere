/**
 * src/components/auth/ProtectedRoute.jsx
 *
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to /login.
 * Shows a full-page spinner while verifying the stored token.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../common/Spinner";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner fullPage />;
  if (!user)   return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
