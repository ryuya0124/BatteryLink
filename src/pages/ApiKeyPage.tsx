import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../hooks/AuthContext";
import { ApiKeyManager } from "../components/ApiKeyManager";
import { Button } from "../components/ui/button";
import { Battery, LogOut, UserIcon } from "lucide-react";

export default function ApiKeyPage() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Battery className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">BatteryLink</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="h-4 w-4" />
              {user?.email}
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>ダッシュボード</Button>
            <Button variant="outline" onClick={handleLogout}>
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