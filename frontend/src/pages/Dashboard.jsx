import { useInventory } from "@/store/inventoryStore";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";
import { KPICards } from "@/components/dashboard/KPICards";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { RecommendationsTable } from "@/components/dashboard/RecommendationsTable";
import { DownloadSection } from "@/components/dashboard/DownloadSection";
import { DASH } from "@/constants/testIds";
import { Sparkles, FileSpreadsheet } from "lucide-react";

export default function Dashboard() {
  const { job } = useInventory();

  if (!job) {
    return (
      <div data-testid={DASH.empty} className="space-y-6 animate-fade-up">
        <PageHeader
          title="Operations Dashboard"
          subtitle="Upload the latest Blinkit inventory export to activate live replenishment intelligence."
          tag="UPLOAD"
        />
        <UploadDropzone />
      </div>
    );
  }

  return (
    <div data-testid={DASH.loaded} className="space-y-6 animate-fade-up">
      <PageHeader
        title="Operations Dashboard"
        subtitle={`Live recommendations for ${job.row_count} SKU-warehouse pairs across ${
          job.charts?.city_inventory?.length || 0
        } cities.`}
        tag="LIVE FEED"
        right={
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-300" />
            <span className="font-mono-num">{job.filename}</span>
          </div>
        }
      />

      <KPICards kpis={job.kpis} />

      <CriticalAlerts alerts={job.alerts} />

      <ChartsSection charts={job.charts} />

      <ExplainBanner />

      <RecommendationsTable jobId={job.job_id} rows={job.recommendations} />

      <DownloadSection
        jobId={job.job_id}
        rowCount={job.row_count}
        replenishQty={job.kpis.total_replenishment_qty}
      />
    </div>
  );
}

const PageHeader = ({ title, subtitle, tag, right }) => (
  <div className="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-300">{tag}</div>
      <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-50 mt-1">
        {title}
      </h1>
      <p className="text-sm text-slate-400 mt-1 max-w-2xl">{subtitle}</p>
    </div>
    {right}
  </div>
);

const ExplainBanner = () => (
  <div className="rounded-lg border-l-2 border-cyan-400 bg-slate-800/40 p-4 flex items-start gap-3">
    <div className="w-8 h-8 shrink-0 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-cyan-300" />
    </div>
    <div className="text-sm text-slate-300">
      <span className="font-display font-bold text-slate-100">AI reasoning is on.</span>{" "}
      Expand any row in the table below to generate a per-SKU explanation grounded in current stock, sales velocity, and lead time —
      powered by Claude Sonnet via Emergent.
    </div>
  </div>
);
