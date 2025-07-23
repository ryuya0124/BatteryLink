import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ApiKeyPage from "./pages/ApiKeyPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthErrorPage from "./pages/AuthErrorPage";
import { useAuth0 } from "@auth0/auth0-react";
import { AccountPage } from "@/pages/AccountPage";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  console.log('RequireAuth:', { isAuthenticated, isLoading });
  if (isLoading) return <FullScreenLoader label="認証情報を確認中..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireNoAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  console.log('RequireNoAuth:', { isAuthenticated, isLoading });
  if (isLoading) return <FullScreenLoader label="認証情報を確認中..." />;
  if (isAuthenticated) return <Navigate to="/" replace />;
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
      <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
} 