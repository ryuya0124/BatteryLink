import React from "react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <main className="state-page"><div className="state-panel">
      <ShieldAlert className="text-destructive" size={32} /><h1>ログインを完了できませんでした</h1>
      <p>認証が中断されたか、セッションの有効期限が切れた可能性があります。もう一度ログインしてください。</p>
      <div className="flex flex-wrap gap-3"><Button asChild><Link to="/login">もう一度ログイン</Link></Button><Button variant="outline" asChild><Link to="/">トップへ戻る</Link></Button></div>
    </div></main>
  );
}
