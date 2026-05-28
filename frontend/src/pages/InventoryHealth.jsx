import { useInventory } from "@/store/inventoryStore";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { HeartPulse } from "lucide-react";

export default function InventoryHealth() {
  const { job } = useInventory();
  if (!job) return <EmptyState icon={HeartPulse} title="Inventory Health" hint="Upload an inventory file from the Dashboard to populate this view." />;

  const cities = job.charts?.city_inventory ?? [];
  const totalSKUs = job.row_count;
  const healthyPct = job.kpis.healthy_inventory_pct;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Inventory Health" subtitle="City and warehouse-level inventory posture." tag="HEALTH" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total SKU-warehouse pairs" value={totalSKUs.toLocaleString()} accent="text-cyan-300" />
        <Stat label="Healthy inventory" value={`${healthyPct}%`} accent="text-emerald-300" />
        <Stat label="Cities monitored" value={cities.length.toLocaleString()} accent="text-amber-300" />
      </div>

      <ChartsSection charts={job.charts} />

      <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
        <h3 className="font-display font-bold text-base text-slate-100 mb-3">City Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {cities.map((c) => (
            <div key={c.city} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between">
                <div className="font-display font-bold text-slate-100">{c.city}</div>
                <span className="font-mono-num text-xs text-slate-400">{c.sku_count} SKUs</span>
              </div>
              <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-red-500 h-full" style={{ width: `${pct(c.high_risk_count, c.sku_count)}%` }} />
                <div className="bg-amber-500 h-full" style={{ width: `${pct(c.medium_risk_count, c.sku_count)}%` }} />
                <div className="bg-emerald-500 h-full" style={{ width: `${pct(c.low_risk_count, c.sku_count)}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-mono-num">
                <span className="text-red-300">H {c.high_risk_count}</span>
                <span className="text-amber-300">M {c.medium_risk_count}</span>
                <span className="text-emerald-300">L {c.low_risk_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value, accent }) => (
  <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
    <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500">{label}</div>
    <div className={`font-mono-num text-3xl font-bold tracking-tighter mt-2 ${accent}`}>{value}</div>
  </div>
);

function pct(a, total) {
  if (!total) return 0;
  return Math.round((a / total) * 100);
}
