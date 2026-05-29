import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const ThemeContext = createContext({
  mode: "system",        // user selection: "light" | "dark" | "system"
  theme: "dark",         // resolved theme actually applied: "light" | "dark"
  setMode: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "icc-theme-mode";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function applyClass(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children, defaultMode = "system" }) {
  const [mode, setModeState] = useState(() => {
    if (typeof window === "undefined") return defaultMode;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return defaultMode;
  });

  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

  // Listen to system theme changes when in "system" mode (or always, cheap)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(MEDIA_QUERY);
    const handler = (e) => setSystemTheme(e.matches ? "dark" : "light");
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, []);

  const theme = mode === "system" ? systemTheme : mode;

  useEffect(() => {
    applyClass(theme);
  }, [theme]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, [mode]);

  const setMode = useCallback((m) => setModeState(m), []);
  const toggle = useCallback(() => {
    // Cycle through: light -> dark -> system -> light
    setModeState((m) => (m === "light" ? "dark" : m === "dark" ? "system" : "light"));
  }, []);

  const value = useMemo(() => ({ mode, theme, setMode, toggle }), [mode, theme, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
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
