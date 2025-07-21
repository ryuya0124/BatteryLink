import React from "react";
import { Button } from "../components/ui/button";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h1 className="text-3xl font-bold mb-4 text-red-600">認証エラー</h1>
      <p className="mb-8">認証に失敗しました。再度ログインしてください。</p>
      <Button onClick={() => window.location.href = "/login"}>ログイン画面へ</Button>
    </div>
  );
} 