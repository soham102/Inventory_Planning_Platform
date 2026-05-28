import { useInventory } from "@/store/inventoryStore";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "#0F172A", border: "1px solid #334155", borderRadius: 8,
  fontSize: 12, color: "#F8FAFC",
};

export default function StockoutRisks() {
  const { job } = useInventory();
  const all = job?.recommendations || [];
  const highRisk = useMemo(() => all.filter((r) => r.stockout_risk === "HIGH"), [all]);

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
        <div className="lg:col-span-2 rounded-lg bg-slate-900 border border-slate-800 p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-red-300">CRITICAL</div>
          <div className="font-display text-xl font-bold text-slate-100 mt-1">High Risk Exposure</div>
          <div className="mt-4 font-mono-num text-5xl text-red-300 font-bold tracking-tighter">
            {highRisk.length.toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-slate-400">SKU-warehouse pairs below lead-time threshold</div>
        </div>

        <div className="lg:col-span-3 rounded-lg bg-slate-900 border border-slate-800 p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-cyan-300">DISTRIBUTION</div>
          <div className="font-display text-base font-bold text-slate-100 mt-1 mb-2">Days of inventory remaining</div>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1E293B" }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <CriticalAlerts alerts={job.alerts} />

      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-display font-bold text-base text-slate-100">All High-Risk SKUs</h3>
          <p className="text-xs text-slate-500">{highRisk.length} entries • sorted by urgency</p>
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-950">
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3 text-right">Days Left</th>
                <th className="px-4 py-3 text-right">Lead</th>
                <th className="px-4 py-3 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {highRisk
                .sort((a, b) => a.days_of_inventory_left - b.days_of_inventory_left)
                .map((r, i) => (
                  <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 font-mono-num text-slate-100">#{r.item_id}</td>
                    <td className="px-4 py-2.5 text-slate-200">{r.warehouse_name}</td>
                    <td className="px-4 py-2.5 text-slate-400">{r.city}</td>
                    <td className="px-4 py-2.5 text-right font-mono-num text-red-300">
                      {Number(r.days_of_inventory_left).toFixed(1)}d
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-num text-slate-400">{r.lead_time_days}d</td>
                    <td className="px-4 py-2.5 text-right font-mono-num text-cyan-300 font-bold">{r.quantity_to_send}</td>
                  </tr>
                ))}
              {!highRisk.length && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No high-risk SKUs.
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
