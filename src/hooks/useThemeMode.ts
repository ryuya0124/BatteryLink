import { useEffect, useState } from "react";
import type { ThemeMode } from "@/types";

const THEME_KEY = "theme-mode";

function getSystemTheme(): "light" | "dark" {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    return saved || "system";
  });

  useEffect(() => {
    let applied: "light" | "dark" = theme === "system" ? getSystemTheme() : theme;
    document.body.classList.toggle("dark", applied === "dark");
  }, [theme]);

  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        document.body.classList.toggle("dark", e.matches);
      }
    };
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem(THEME_KEY, mode);
  };

  return [theme, setThemeMode];
} 