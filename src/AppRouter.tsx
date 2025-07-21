import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ApiKeyPage from "./pages/ApiKeyPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import AuthErrorPage from "./pages/AuthErrorPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/apikeys" element={<ApiKeyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth-error" element={<AuthErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
} 