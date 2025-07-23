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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">BatteryLink</h1>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 w-full">
            <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">ダッシュボード</Button>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center">
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
        <ApiKeyManager />
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 BatteryLink</p>
        </footer>
      </div>
    </div>
  );
} 