import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  HeartPulse,
  AlertTriangle,
  ListChecks,
  FileBarChart2,
  Settings,
  Radar,
} from "lucide-react";
import { NAV } from "@/constants/testIds";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, tid: NAV.itemDashboard, end: true },
  { to: "/inventory-health", label: "Inventory Health", icon: HeartPulse, tid: NAV.itemInventoryHealth },
  { to: "/stockout-risks", label: "Stockout Risks", icon: AlertTriangle, tid: NAV.itemStockoutRisks },
  { to: "/recommendations", label: "Recommendations", icon: ListChecks, tid: NAV.itemRecommendations },
  { to: "/reports", label: "Reports", icon: FileBarChart2, tid: NAV.itemReports },
  { to: "/settings", label: "Settings", icon: Settings, tid: NAV.itemSettings },
];

export const Sidebar = () => {
  return (
    <aside
      data-testid={NAV.sidebar}
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-30"
    >
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <div className="w-8 h-8 rounded-md bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
            <Radar className="w-4 h-4 text-cyan-600 dark:text-cyan-300" strokeWidth={2.25} />
          </div>
          <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-black text-sm tracking-tight text-slate-900 dark:text-slate-50">COMMAND CENTER</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500 dark:text-slate-500">Inventory OS</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500 dark:text-slate-500">Operations</div>
        {items.map(({ to, label, icon: Icon, tid, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-testid={tid}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                "border border-transparent",
                isActive
                  ? "bg-slate-900 text-cyan-300 border-slate-800 shadow-[inset_2px_0_0_0_rgb(34,211,238)]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
              )
            }
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="m-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300 font-bold">System Online</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">All pipelines operational</div>
        <div className="mt-2 font-mono-num text-[11px] text-slate-500 dark:text-slate-500 dark:text-slate-500">v1.0 · sync 12:42 UTC</div>
      </div>
    </aside>
  );
};
