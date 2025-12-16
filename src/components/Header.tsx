import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "./ui/button";
import { Battery, LogOut, UserIcon, Home } from "lucide-react";

interface HeaderProps {
  error?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  error,
}) => {
  const { logout } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  // 現在のページを判定
  const isDashboard = location.pathname === "/dashboard";
  const isAccount = location.pathname === "/account";
  const isApiKeys = location.pathname === "/apikeys";

  return (
    <>
      {error && (
        <div className="mb-4 text-red-600 font-bold bg-red-50 border border-red-200 rounded px-4 py-2 flex-shrink-0">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 gap-2 sm:gap-0 flex-shrink-0">
        <div className="flex items-center gap-2 justify-center sm:justify-start min-w-0">
          <Battery className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 
            className="text-2xl sm:text-3xl font-bold text-foreground drop-shadow min-w-0 max-w-full flex-shrink-0 truncate cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => navigate("/dashboard")}
            title="ホームに戻る"
          >
            BatterySync
          </h1>
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 w-full min-w-0">
          {!isDashboard && (
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")} 
              className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-1" />ダッシュボード
            </Button>
          )}
          {!isAccount && (
            <Button 
              variant="outline" 
              onClick={() => navigate("/account")} 
              className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center"
            >
              <UserIcon className="h-4 w-4 mr-1" />アカウント
            </Button>
          )}
          {!isApiKeys && (
            <Button 
              variant="outline" 
              onClick={() => navigate("/apikeys")} 
              className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center"
            >
              APIキー管理
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} 
            className="w-full sm:w-auto flex-1 sm:flex-none min-w-0 text-xs sm:text-sm whitespace-nowrap flex items-center justify-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>
    </>
  );
};