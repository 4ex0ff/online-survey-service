import { Navigate } from "react-router-dom";

import { useAuth } from "../providers/useAuth";

function PublicOnlyRoute({ children }) {
  // Авторизованные пользователи не должны снова видеть формы login/register.
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicOnlyRoute;
