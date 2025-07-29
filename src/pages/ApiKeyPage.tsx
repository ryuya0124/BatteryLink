import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ApiKeyManager } from "../components/ApiKeyManager";
import { Button } from "../components/ui/button";
import { Header } from "@/components/Header";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";

export default function ApiKeyPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const showLoader = useDelayedLoader(isLoading);
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  if (showLoader) return <FullScreenLoader label="APIキー管理ページを読み込み中..." />;
  if (!isAuthenticated) return <div>未認証</div>;
  const handleLogout = async () => {
    await logout({ logoutParams: { returnTo: window.location.origin } });
    navigate("/login");
  };
  // fetchApiKeysやsetLoading, setError, setApiKeysはApiKeyManagerに一任するため削除
  return (
    <div className="h-screen bg-background text-foreground transition-colors overflow-hidden">
      <div className="container w-full max-w-full mx-auto px-0 sm:px-1 lg:px-2 py-4 sm:py-8 h-full flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <ApiKeyManager />
        </div>
        <footer className="mt-8 sm:mt-16 text-center text-muted-foreground text-xs sm:text-sm w-full flex-shrink-0">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
} 