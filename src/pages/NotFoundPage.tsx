import React from "react";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground transition-colors">
      <h1 className="text-4xl font-bold mb-4">404 Not Found</h1>
      <p className="mb-8">お探しのページは見つかりませんでした。</p>
      <Button onClick={() => window.location.href = "/"}>トップへ戻る</Button>
    </div>
  );
} 