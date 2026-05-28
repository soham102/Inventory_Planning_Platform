import { AlertTriangle, Flame, Building2 } from "lucide-react";
import { DASH } from "@/constants/testIds";

export const CriticalAlerts = ({ alerts = [] }) => {
  if (!alerts.length) {
    return (
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-6 text-center text-sm text-slate-400">
        <div className="font-display font-bold text-slate-200 mb-1">No critical alerts</div>
        All SKUs above stockout threshold.
      </div>
    );
  }

  return (
    <div data-testid={DASH.alerts} className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-red-400" />
        <h3 className="font-display font-bold text-base text-slate-100">Critical Alerts</h3>
        <span className="ml-auto text-[10px] uppercase tracking-[0.15em] font-bold text-red-300 bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5">
          {alerts.length} urgent
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {alerts.slice(0, 8).map((a, i) => (
          <div
            key={i}
            className="relative rounded-lg bg-red-500/[0.06] border border-red-500/30 p-3 hover:border-red-500/60 transition-colors"
          >
            <div className="absolute top-3 right-3">
              <span className="block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-dot" />
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">{a.title}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3" /> {a.subtitle}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between font-mono-num text-xs">
              <span className="text-red-300 font-bold">{a.metric}</span>
              <span className="text-slate-500">LT {a.lead_time}d · send {a.qty}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
