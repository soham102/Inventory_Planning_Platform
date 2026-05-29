import { useMemo, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, AlertTriangle, ShieldCheck, Hourglass, Package } from "lucide-react";

const RISK_META = {
  HIGH: { label: "High", color: "text-red-300", dot: "bg-red-400", bar: "bg-red-500" },
  MEDIUM: { label: "Medium", color: "text-amber-300", dot: "bg-amber-400", bar: "bg-amber-500" },
  LOW: { label: "Low", color: "text-emerald-300", dot: "bg-emerald-400", bar: "bg-emerald-500" },
};

export const CityBreakdownDrawer = ({ city, allRows, open, onOpenChange }) => {
  const [tab, setTab] = useState("HIGH");

  const rowsForCity = useMemo(() => {
    if (!city) return [];
    return allRows.filter((r) => r.city === city);
  }, [city, allRows]);

  const grouped = useMemo(() => {
    const g = { HIGH: [], MEDIUM: [], LOW: [] };
    for (const r of rowsForCity) {
      if (g[r.stockout_risk]) g[r.stockout_risk].push(r);
    }
    // sort each: HIGH/MEDIUM by days_left ascending, LOW by days_left descending
    g.HIGH.sort((a, b) => a.days_of_inventory_left - b.days_of_inventory_left);
    g.MEDIUM.sort((a, b) => a.days_of_inventory_left - b.days_of_inventory_left);
    g.LOW.sort((a, b) => b.days_of_inventory_left - a.days_of_inventory_left);
    return g;
  }, [rowsForCity]);

  const totalSend = rowsForCity.reduce((s, r) => s + (r.quantity_to_send || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 w-full sm:max-w-xl p-0 overflow-hidden flex flex-col"
        data-testid="city-drawer"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-cyan-600 dark:text-cyan-300">CITY DRILL-DOWN</div>
              <SheetTitle className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                {city ?? ""}
              </SheetTitle>
            </div>
          </div>
          <SheetDescription className="text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-sm">
            {rowsForCity.length} SKU-warehouse pairs ·{" "}
            <span className="font-mono-num text-cyan-600 dark:text-cyan-300">{totalSend}</span> units to dispatch
          </SheetDescription>

          <div className="grid grid-cols-3 gap-2">
            {(["HIGH", "MEDIUM", "LOW"]).map((k) => {
              const meta = RISK_META[k];
              return (
                <div
                  key={k}
                  className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-2"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  <div className="leading-tight">
                    <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-slate-500 dark:text-slate-500 dark:text-slate-500">{meta.label}</div>
                    <div className={`font-mono-num text-base font-bold ${meta.color}`}>
                      {grouped[k].length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-3 h-9">
            {(["HIGH", "MEDIUM", "LOW"]).map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                data-testid={`tab-${k.toLowerCase()}`}
                className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50 text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.1em]"
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${RISK_META[k].dot}`} />
                {RISK_META[k].label} <span className="ml-1.5 font-mono-num opacity-70">{grouped[k].length}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {(["HIGH", "MEDIUM", "LOW"]).map((k) => (
            <TabsContent key={k} value={k} className="flex-1 min-h-0 overflow-auto mt-4 px-6 pb-6">
              <RiskList rows={grouped[k]} risk={k} />
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const RiskList = ({ rows, risk }) => {
  if (!rows.length) {
    const Icon = risk === "LOW" ? ShieldCheck : AlertTriangle;
    return (
      <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-500 dark:text-slate-500">
        <Icon className="w-6 h-6 mb-2 text-slate-500 dark:text-slate-500 dark:text-slate-400 dark:text-slate-600" />
        <div className="text-sm">No {RISK_META[risk].label.toLowerCase()}-risk SKUs in this city.</div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <RowCard key={`${r.warehouse_id}-${r.item_id}-${i}`} r={r} risk={risk} />
      ))}
    </div>
  );
};

const RowCard = ({ r, risk }) => {
  const meta = RISK_META[risk];
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono-num text-sm text-slate-900 dark:text-slate-100">#{r.item_id}</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] ${meta.color} bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800`}>
              <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-0.5 truncate">{r.warehouse_name}</div>
        </div>
        {r.quantity_to_send > 0 && (
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase tracking-[0.15em] font-bold text-slate-500 dark:text-slate-500 dark:text-slate-500">Send</div>
            <div className="font-mono-num text-sm font-bold text-cyan-600 dark:text-cyan-300">{r.quantity_to_send}</div>
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
        <Mini icon={Hourglass} label="Days left" value={`${Number(r.days_of_inventory_left).toFixed(1)}d`} accent={meta.color} />
        <Mini icon={Hourglass} label="Lead" value={`${r.lead_time_days}d`} />
        <Mini icon={Package} label="Stock" value={r.current_stock} />
        <Mini icon={Package} label="Incoming" value={r.incoming_stock} />
      </div>
    </div>
  );
};

const Mini = ({ icon: Icon, label, value, accent = "text-slate-200" }) => (
  <div className="rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1.5">
    <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold">
      <Icon className="w-2.5 h-2.5" /> {label}
    </div>
    <div className={`font-mono-num text-sm mt-0.5 ${accent}`}>{value}</div>
  </div>
);
