import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading, error: authError } = useAuth0();
  const location = useLocation();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = typeof location.state?.returnTo === "string" ? location.state.returnTo : "/dashboard";
  useEffect(() => {
    if (isAuthenticated || isLoading || authError || started.current) return;
    started.current = true;
    loginWithRedirect({ appState: { returnTo } }).catch(() => setError("ログイン画面に接続できませんでした。もう一度お試しください。"));
  }, [isAuthenticated, isLoading, authError, loginWithRedirect, returnTo]);
  if (error || authError) return <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
    <div className="max-w-md space-y-4 rounded-xl border p-6">
      <h1 className="text-xl font-semibold">ログインできませんでした</h1>
      <p role="alert" className="text-sm text-muted-foreground">{error || "認証を完了できませんでした。再試行してください。"}</p>
      <Button onClick={() => { setError(null); loginWithRedirect({ appState: { returnTo } }).catch(() => setError("接続に失敗しました。")); }}>再試行</Button>
    </div>
  </main>;
  return <FullScreenLoader label="ログイン画面へ移動しています…" />;
}
