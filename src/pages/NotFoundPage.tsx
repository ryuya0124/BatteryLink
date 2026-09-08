import React from "react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="state-page"><div className="state-panel">
      <Compass className="text-primary" size={32} /><h1>ページが見つかりません</h1>
      <p>URLが変更されたか、ページが削除された可能性があります。トップページからお探しください。</p>
      <Button asChild><Link to="/"><ArrowLeft size={16} />トップへ戻る</Link></Button>
      <div className="mt-8 text-xs text-muted-foreground">404 / BatterySync</div>
    </div></main>
  );
}
