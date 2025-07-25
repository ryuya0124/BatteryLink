import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ApiKeyManager } from "../components/ApiKeyManager";
import { Button } from "../components/ui/button";
import { Battery, LogOut, UserIcon } from "lucide-react";
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
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="container w-full max-w-full mx-auto px-0 sm:px-1 lg:px-2 py-4 sm:py-8 my-2 sm:my-4 lg:my-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start min-w-0">
            <Battery className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground drop-shadow min-w-0 max-w-full flex-shrink-0 truncate">BatterySync</h1>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 w-full min-w-0">
            <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">ダッシュボード</Button>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
        <ApiKeyManager />
        <footer className="mt-8 sm:mt-16 text-center text-muted-foreground text-xs sm:text-sm w-full">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
} 