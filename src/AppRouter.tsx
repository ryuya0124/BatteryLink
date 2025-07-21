import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ApiKeyPage from "./pages/ApiKeyPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthErrorPage from "./pages/AuthErrorPage";
import { useAuthContext } from "./hooks/AuthContext";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuthContext();
  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireNoAuth({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuthContext();
  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/apikeys" element={<RequireAuth><ApiKeyPage /></RequireAuth>} />
      <Route path="/login" element={<RequireNoAuth><LoginPage /></RequireNoAuth>} />
      <Route path="/signup" element={<RequireNoAuth><SignupPage /></RequireNoAuth>} />
      <Route path="/auth-error" element={<AuthErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
} 