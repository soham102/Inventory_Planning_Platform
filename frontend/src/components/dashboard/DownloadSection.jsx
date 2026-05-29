import { Download, FileDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DASH } from "@/constants/testIds";
import { downloadROSheetUrl } from "@/lib/api";

export const DownloadSection = ({ jobId, rowCount, replenishQty }) => {
  const url = downloadROSheetUrl(jobId);
  return (
    <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 mb-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold">Operations ready</span>
        </div>
        <h3 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Final Replenishment Order Sheet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-1">
          <span className="font-mono-num text-slate-800 dark:text-slate-200">{rowCount?.toLocaleString()}</span> SKU recommendations ·{" "}
          <span className="font-mono-num text-cyan-600 dark:text-cyan-300">{replenishQty?.toLocaleString()}</span> units to dispatch
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        <a
          data-testid={DASH.downloadRO}
          href={url}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all glow-cyan"
        >
          <Download className="w-4 h-4" />
          Download Final RO Sheet
        </a>
        <Button
          data-testid={DASH.exportReport}
          variant="outline"
          onClick={() => window.print()}
          className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 font-semibold"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
};
