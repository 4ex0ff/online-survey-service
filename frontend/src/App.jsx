import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./providers/useAuth";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PublicSurveyPage from "./pages/PublicSurveyPage";
import RegisterPage from "./pages/RegisterPage";
import SurveyBuilderPage from "./pages/SurveyBuilderPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";

function HomeRedirect() {
  // Корневой URL выбирает стартовую страницу по локальному состоянию авторизации.
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function App() {
  // Решения по маршрутизации держим здесь; страницы занимаются своим UI и API-вызовами.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/surveys/:surveyID/edit"
          element={
            <ProtectedRoute>
              <SurveyBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route path="/s/:surveyID" element={<PublicSurveyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
