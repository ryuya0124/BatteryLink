import React from "react";
import { Link } from "react-router-dom";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  error?: string | null;
  lockScroll?: boolean; // true: 子でスクロール制御（ダッシュボード用）、false: ページ全体でスクロール（デフォルト）
}

export const Layout: React.FC<LayoutProps> = ({ children, error, lockScroll = false }) => {
  const rootClass = lockScroll
    ? "min-h-dvh lg:h-dvh bg-background text-foreground transition-colors overflow-auto lg:overflow-hidden"
    : "min-h-screen bg-background text-foreground transition-colors overflow-auto";

  return (
    <div className={rootClass}>
      <div className="app-container">
        <Header error={error} />
        <main id="main-content" className={`app-main ${lockScroll ? "lg:overflow-auto" : ""}`}>
          {children}
        </main>
        <footer className="app-footer">
          <p>© {new Date().getFullYear()} BatterySync</p>
          <nav aria-label="フッターナビゲーション">
            <Link to="/privacy" className="hover:text-foreground transition-colors">プライバシーポリシー</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">利用規約</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
};
