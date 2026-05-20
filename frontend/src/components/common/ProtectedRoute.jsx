// src/components/common/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';

function ProtectedRoute({ children }) {
    const { isAuthenticated, token } = useAuth();

    if (!isAuthenticated || !token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;