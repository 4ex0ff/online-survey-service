import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.scss';
import { AuthProvider } from './providers/AuthProvider';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MakerPage from './pages/MakerPage';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* --- Публичные маршруты --- */}
                    <Route path='/login' element={<LoginPage />} />
                    <Route path='/register' element={<RegisterPage />} />
                    
                    {/* --- Защищённые маршруты --- */}
                    <Route path='/' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path='/dashboard' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path='/maker' element={<ProtectedRoute><MakerPage /></ProtectedRoute>} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;