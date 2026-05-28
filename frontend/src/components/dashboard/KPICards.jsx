import { AlertTriangle, Package, Warehouse, ShieldCheck, ClipboardList, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DASH } from "@/constants/testIds";

const cards = [
  {
    key: "high_risk_skus",
    title: "High Risk SKUs",
    icon: AlertTriangle,
    accent: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    tid: DASH.kpiHighRisk,
    fmt: (v) => v.toLocaleString(),
    trend: "up",
    sub: "Imminent stockout",
    to: "/stockout-risks",
  },
  {
    key: "total_replenishment_qty",
    title: "Replenishment Qty",
    icon: Package,
    accent: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    tid: DASH.kpiReplenishQty,
    fmt: (v) => v.toLocaleString(),
    trend: "up",
    sub: "Units to dispatch",
    to: "/recommendations?alert=PLACE+ORDER",
  },
  {
    key: "warehouses_at_risk",
    title: "Warehouses At Risk",
    icon: Warehouse,
    accent: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    tid: DASH.kpiWarehouseRisk,
    fmt: (v) => v.toLocaleString(),
    trend: "flat",
    sub: "Need urgent action",
    to: "/inventory-health",
  },
  {
    key: "healthy_inventory_pct",
    title: "Healthy Inventory",
    icon: ShieldCheck,
    accent: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    tid: DASH.kpiHealthyPct,
    fmt: (v) => `${v}%`,
    trend: "down",
    sub: "Low risk SKUs",
    to: "/recommendations?risk=LOW",
  },
  {
    key: "pending_orders",
    title: "Pending Orders",
    icon: ClipboardList,
    accent: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    tid: DASH.kpiPendingOrders,
    fmt: (v) => v.toLocaleString(),
    trend: "up",
    sub: "Awaiting RO place",
    to: "/recommendations?alert=PLACE+ORDER",
  },
];

export const KPICards = ({ kpis }) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(({ key, title, icon: Icon, accent, bg, border, tid, fmt, trend, sub, to }, i) => {
        const value = kpis?.[key] ?? 0;
        return (
          <button
            type="button"
            key={key}
            data-testid={tid}
            onClick={() => navigate(to)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="text-left animate-fade-up group rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all p-4 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-md ${bg} ${border} border flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${accent}`} strokeWidth={2} />
              </div>
              {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
              {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              {trend === "flat" && <span className="text-[10px] font-mono-num text-slate-500">—</span>}
            </div>
            <div className="mt-4 text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500">{title}</div>
            <div className={`mt-1 font-mono-num text-3xl lg:text-4xl font-bold tracking-tighter ${accent}`}>
              {fmt(value)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>{sub}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300 font-bold uppercase tracking-[0.1em] text-[9px]">
                View →
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
