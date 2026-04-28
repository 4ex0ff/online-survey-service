import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null = проверяем, true/false = результат
    const token = localStorage.getItem('token');

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                const response = await fetch('/api/validate-token', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error validating token:', error);
                setIsAuthenticated(false);
            }
        };

        validateToken();
    }, [token]);

    if (isAuthenticated === null) {
        return(
            <div className='loading-page'>
                <div className='loading-frame'>
                    <div className='spinner'></div>
                    <p className='text-h2'>Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;