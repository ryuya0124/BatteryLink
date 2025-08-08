import React from "react";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  error?: string | null;
  lockScroll?: boolean; // true: 子でスクロール制御（ダッシュボード用）、false: ページ全体でスクロール（デフォルト）
}

export const Layout: React.FC<LayoutProps> = ({ children, error, lockScroll = false }) => {
  const rootClass = lockScroll
    ? "h-screen bg-background text-foreground transition-colors overflow-hidden"
    : "min-h-screen bg-background text-foreground transition-colors overflow-auto";

  return (
    <div className={rootClass}>
      <div className="container w-full max-w-full mx-auto px-4 sm:px-8 lg:px-16 py-6 sm:py-10 h-full flex flex-col">
        <Header error={error} />
        <div className={lockScroll ? "flex-1 overflow-hidden min-h-0" : "flex-1 min-h-0"} style={{ scrollbarGutter: 'stable' }}>
          {children}
        </div>
        <footer className="mt-8 sm:mt-16 text-center text-muted-foreground text-xs sm:text-sm w-full flex-shrink-0">
          <p>© 2025 BatterySync</p>
        </footer>
      </div>
    </div>
  );
};
