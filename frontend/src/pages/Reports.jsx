import { useInventory } from "@/store/inventoryStore";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { FileBarChart2, Download, FileSpreadsheet } from "lucide-react";
import { downloadROSheetUrl } from "@/lib/api";

export default function Reports() {
  const { job } = useInventory();
  if (!job) return <EmptyState icon={FileBarChart2} title="Reports" hint="No reports yet. Upload an inventory file from the Dashboard." />;

  const reports = [
    {
      title: "Final RO Sheet",
      sub: "Sorted by risk + qty-to-send · 2 sheets",
      cta: "Download .xlsx",
      url: downloadROSheetUrl(job.job_id),
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Reports" subtitle="Generated artefacts ready for distribution to warehouse leads." tag="EXPORTS" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <div key={r.title} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col">
            <div className="w-10 h-10 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
              <r.icon className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
            </div>
            <div className="font-display font-bold text-slate-900 dark:text-slate-100">{r.title}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-1">{r.sub}</div>
            <a
              href={r.url}
              className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold glow-cyan w-fit"
            >
              <Download className="w-4 h-4" /> {r.cta}
            </a>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 mb-3">Run summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SumStat label="Job ID" value={job.job_id.slice(0, 8)} />
          <SumStat label="Created" value={new Date(job.created_at).toLocaleString()} />
          <SumStat label="Rows" value={job.row_count} />
          <SumStat label="High risk" value={job.kpis.high_risk_skus} accent="text-red-300" />
        </div>
      </div>
    </div>
  );
}

const SumStat = ({ label, value, accent = "text-slate-100" }) => (
  <div className="rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
    <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500 dark:text-slate-500 dark:text-slate-500">{label}</div>
    <div className={`font-mono-num text-sm mt-1 ${accent}`}>{value}</div>
  </div>
);
