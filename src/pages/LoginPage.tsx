import { useAuth0 } from "@auth0/auth0-react";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import { useState, useEffect } from "react";
import { useDelayedLoader } from "@/hooks/useDelayedLoader";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const showLoader = useDelayedLoader(isLoading);

  if (showLoader) return <FullScreenLoader label="ログインページを読み込み中..." />;
  if (isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">ログイン済み</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-xl shadow-lg p-10 flex flex-col items-center max-w-md w-full">
        <img src="/vite.svg" alt="BatteryLink Logo" className="w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-gray-900">BatteryLink</h1>
        <p className="mb-6 text-gray-600 text-center">バッテリー情報をスマートに管理。<br />複数デバイスを一元監視。</p>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition mb-2 w-full"
          onClick={() => loginWithRedirect()}
        >
          Auth0でログイン
        </button>
        <p className="text-xs text-gray-400 mt-4">© 2025 BatteryLink</p>
      </div>
    </div>
  );
} 