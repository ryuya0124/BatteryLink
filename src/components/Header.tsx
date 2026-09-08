import { Link, NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "./ui/button";
import { Battery, KeyRound, LayoutDashboard, LogOut, UserRound } from "lucide-react";

export function Header({error}: {error?: string | null}) {
  const {logout} = useAuth0();
  return <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3">本文へスキップ</a>
    <header className="app-header">
      <Link to="/dashboard" className="app-brand"><Battery size={27} className="text-primary" />BatterySync</Link>
      <nav className="app-navigation" aria-label="メインナビゲーション">
        <NavLink to="/dashboard"><LayoutDashboard size={17} /><span>ダッシュボード</span></NavLink>
        <NavLink to="/apikeys"><KeyRound size={17} /><span>APIキー</span></NavLink>
        <NavLink to="/account"><UserRound size={17} /><span>アカウント</span></NavLink>
      </nav>
      <Button variant="ghost" size="icon" className="app-logout" aria-label="ログアウト" title="ログアウト" onClick={() => logout({logoutParams: {returnTo: window.location.origin + "/"}})}><LogOut size={18} /></Button>
    </header>
    {error && <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
  </>;
}
