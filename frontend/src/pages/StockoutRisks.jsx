import { useInventory } from "@/store/inventoryStore";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { AlertTriangle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTheme, chartTokens } from "@/lib/theme";

const TOOLTIP_STYLE = {
  background: "#0F172A", border: "1px solid #334155", borderRadius: 8,
  fontSize: 12, color: "#F8FAFC",
};

export default function StockoutRisks() {
  const { job } = useInventory();
  const { theme } = useTheme();
  const t = chartTokens(theme);
  const tooltipStyle = {
    background: t.tooltipBg,
    border: `1px solid ${t.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 12,
    color: t.tooltipText,
  };
  const all = job?.recommendations || [];
  const highRisk = useMemo(() => all.filter((r) => r.stockout_risk === "HIGH"), [all]);
  const [cityFilter, setCityFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const cities = useMemo(() => {
    const set = new Set();
    for (const r of highRisk) if (r.city) set.add(r.city);
    return Array.from(set).sort();
  }, [highRisk]);

  const filteredHighRisk = useMemo(() => {
    const q = search.trim().toLowerCase();
    return highRisk
      .filter((r) => cityFilter === "ALL" || r.city === cityFilter)
      .filter((r) => {
        if (!q) return true;
        return (
          String(r.item_id).toLowerCase().includes(q) ||
          String(r.warehouse_name).toLowerCase().includes(q) ||
          String(r.city).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.days_of_inventory_left - b.days_of_inventory_left);
  }, [highRisk, cityFilter, search]);

  const buckets = useMemo(() => {
    const b = [
      { range: "0-1d", count: 0 },
      { range: "1-3d", count: 0 },
      { range: "3-7d", count: 0 },
      { range: "7-14d", count: 0 },
      { range: "14d+", count: 0 },
    ];
    for (const r of all) {
      const d = r.days_of_inventory_left;
      if (d <= 1) b[0].count++;
      else if (d <= 3) b[1].count++;
      else if (d <= 7) b[2].count++;
      else if (d <= 14) b[3].count++;
      else b[4].count++;
    }
    return b;
  }, [all]);

  if (!job) return <EmptyState icon={AlertTriangle} title="Stockout Risks" hint="No data yet. Upload an inventory file from the Dashboard." />;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Stockout Risks" subtitle="Real-time exposure across the warehouse network." tag="RISK" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-red-600 dark:text-red-300">CRITICAL</div>
          <div className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">High Risk Exposure</div>
          <div className="mt-4 font-mono-num text-5xl text-red-600 dark:text-red-300 font-bold tracking-tighter">
            {highRisk.length.toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">SKU-warehouse pairs below lead-time threshold</div>
        </div>

        <div className="lg:col-span-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-cyan-600 dark:text-cyan-300">DISTRIBUTION</div>
          <div className="font-display text-base font-bold text-slate-900 dark:text-slate-100 mt-1 mb-2">Days of inventory remaining</div>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: t.tickPrimary, fontSize: 11 }} tickLine={false} axisLine={{ stroke: t.axis }} />
                <YAxis tick={{ fill: t.tickMuted, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={t.accentCyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <CriticalAlerts alerts={job.alerts} />

      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">All High-Risk SKUs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500">
              {filteredHighRisk.length.toLocaleString()} of {highRisk.length.toLocaleString()} entries · sorted by urgency
            </p>
          </div>

          <div className="sm:ml-auto flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 dark:text-slate-500" />
              <Input
                data-testid="high-risk-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, warehouse, city..."
                className="bg-transparent border-0 h-7 p-0 text-sm placeholder:text-slate-500 focus-visible:ring-0"
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger data-testid="high-risk-city-filter" className="h-9 w-full sm:w-40 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 max-h-72">
                <SelectItem value="ALL">All Cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-950">
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3 text-right">Days Left</th>
                <th className="px-4 py-3 text-right">Lead</th>
                <th className="px-4 py-3 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {filteredHighRisk.map((r, i) => (
                <tr key={`${r.warehouse_id}-${r.item_id}-${i}`} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 font-mono-num text-slate-900 dark:text-slate-100">#{r.item_id}</td>
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">{r.warehouse_name}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">{r.city}</td>
                  <td className="px-4 py-2.5 text-right font-mono-num text-red-600 dark:text-red-300">
                    {Number(r.days_of_inventory_left).toFixed(1)}d
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono-num text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">{r.lead_time_days}d</td>
                  <td className="px-4 py-2.5 text-right font-mono-num text-cyan-600 dark:text-cyan-300 font-bold">{r.quantity_to_send}</td>
                </tr>
              ))}
              {!filteredHighRisk.length && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-500 dark:text-slate-500">
                    No high-risk SKUs match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
