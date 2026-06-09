import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.scss';
import { AuthProvider } from './providers/AuthProvider';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MakerPage from './pages/MakerPage';
import TakerPage from './pages/TakerPage';
import ResultsPage from './pages/ResultsPage';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* --- Публичные маршруты --- */}
                    <Route path='/login' element={<LoginPage />} />
                    <Route path='/register' element={<RegisterPage />} />

                    {/* Прохождение опроса — публично, без авторизации */}
                    <Route path='/survey/:id' element={<TakerPage />} />

                    {/* --- Защищённые маршруты --- */}
                    <Route path='/' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path='/dashboard' element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

                    {/* Конструктор: новый опрос и редактирование существующего */}
                    <Route path='/maker' element={<ProtectedRoute><MakerPage /></ProtectedRoute>} />
                    <Route path='/maker/:id' element={<ProtectedRoute><MakerPage /></ProtectedRoute>} />

                    {/* Результаты — только для автора */}
                    <Route path='/survey/:id/results' element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
