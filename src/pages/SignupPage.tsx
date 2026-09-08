import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Battery, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const {loginWithRedirect} = useAuth0();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <main className="state-page"><div className="state-panel"><Battery size={34} className="text-primary" /><h1>BatterySyncへ<br />ようこそ。</h1><p>デバイスのバッテリーを、ひとつの場所で。Auth0の画面でアカウントを作成して始めましょう。</p>
    {error && <p role="alert">{error}</p>}
    <Button className="w-full" disabled={busy} onClick={async () => {setBusy(true); setError(""); try {await loginWithRedirect({authorizationParams: {screen_hint: "signup"}, appState: {returnTo: "/dashboard"}});} catch {setError("接続できませんでした。もう一度お試しください。"); setBusy(false);}}}>{busy ? "移動しています…" : "アカウントを作成"}<ArrowRight size={16} /></Button>
    <div className="mt-6 flex justify-between gap-3 text-sm text-muted-foreground"><Link to="/">トップへ戻る</Link><Link to="/login">ログインはこちら</Link></div>
  </div></main>;
}
