import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../providers/useAuth";

function ProtectedRoute({ children }) {
  // Dashboard и будущие приватные страницы должны проходить через этот route guard.
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
