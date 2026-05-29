import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({ theme: "dark", setTheme: () => {}, toggle: () => {} });

const STORAGE_KEY = "icc-theme";

function applyClass(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children, defaultTheme = "dark" }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return defaultTheme;
    return window.localStorage.getItem(STORAGE_KEY) || defaultTheme;
  });

  useEffect(() => {
    applyClass(theme);
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = useCallback((t) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// Chart palette helpers so Recharts can switch colors with theme
export function chartTokens(theme) {
  const dark = theme === "dark";
  return {
    grid: dark ? "#1E293B" : "#E2E8F0",
    axis: dark ? "#1E293B" : "#CBD5E1",
    tickPrimary: dark ? "#94A3B8" : "#475569",
    tickMuted: dark ? "#64748B" : "#94A3B8",
    tooltipBg: dark ? "#0F172A" : "#FFFFFF",
    tooltipBorder: dark ? "#334155" : "#E2E8F0",
    tooltipText: dark ? "#F8FAFC" : "#0F172A",
    tooltipLabel: dark ? "#94A3B8" : "#475569",
    legend: dark ? "#94A3B8" : "#475569",
    cursorFill: dark ? "rgba(34,211,238,0.05)" : "rgba(8,145,178,0.08)",
    accentCyan: dark ? "#22D3EE" : "#0891B2",
    accentEmerald: dark ? "#10B981" : "#059669",
    accentAmber: dark ? "#F59E0B" : "#D97706",
    accentRed: dark ? "#EF4444" : "#DC2626",
    accentDotStroke: dark ? "#0F172A" : "#FFFFFF",
  };
}
