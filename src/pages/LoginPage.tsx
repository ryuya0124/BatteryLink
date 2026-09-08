import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
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
  if (error || authError) return <main className="state-page">
    <div className="state-panel">
      <ShieldAlert size={32} className="text-primary" />
      <h1>ログインできませんでした</h1>
      <p role="alert" className="text-sm text-muted-foreground">{error || "認証を完了できませんでした。再試行してください。"}</p>
      <Button onClick={() => { setError(null); loginWithRedirect({ appState: { returnTo } }).catch(() => setError("接続に失敗しました。")); }}>再試行</Button>
      <Button asChild variant="ghost" className="ml-3"><Link to="/">トップへ戻る</Link></Button>
    </div>
  </main>;
  return <FullScreenLoader label="ログイン画面へ移動しています…" />;
}
