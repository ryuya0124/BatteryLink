import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ApiKeyPage from "./pages/ApiKeyPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthErrorPage from "./pages/AuthErrorPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import LandingPage from "./pages/LandingPage";
import { useAuth0 } from "@auth0/auth0-react";
import { AccountPage } from "@/pages/AccountPage";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useAuthLoading } from "@/hooks/AuthLoadingContext";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  const { setAuthLoadingShown } = useAuthLoading();
  if (isLoading) {
    setAuthLoadingShown(true);
    return <FullScreenLoader label="認証情報を確認中..." />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireNoAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  console.log('RequireNoAuth:', { isAuthenticated, isLoading });
  if (isLoading) return <FullScreenLoader label="認証情報を確認中..." />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ルート"/"用: 認証済みならダッシュボード、未認証ならランディングページ
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth0();
  const { setAuthLoadingShown } = useAuthLoading();
  if (isLoading) {
    setAuthLoadingShown(true);
    return <FullScreenLoader label="認証情報を確認中..." />;
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/apikeys" element={<RequireAuth><ApiKeyPage /></RequireAuth>} />
      <Route path="/login" element={<RequireNoAuth><LoginPage /></RequireNoAuth>} />
      <Route path="/signup" element={<RequireNoAuth><SignupPage /></RequireNoAuth>} />
      <Route path="/auth-error" element={<AuthErrorPage />} />
      <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
} 