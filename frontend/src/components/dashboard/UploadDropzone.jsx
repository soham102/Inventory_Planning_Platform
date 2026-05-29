import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadInventoryFile } from "@/lib/api";
import { inventoryStore, useInventory } from "@/store/inventoryStore";
import { UPLOAD } from "@/constants/testIds";
import { toast } from "sonner";

export const UploadDropzone = () => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | parsed | error
  const { isLoading } = useInventory();

  function pick(f) {
    if (!f) return;
    const ok = /\.(xlsx|xls)$/i.test(f.name);
    if (!ok) {
      toast.error("Only .xlsx or .xls files are supported");
      return;
    }
    setFile(f);
    setStatus("idle");
    setProgress(0);
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    pick(f);
  }

  async function onGenerate() {
    if (!file) return;
    setStatus("uploading");
    setProgress(5);
    inventoryStore.setLoading(true);
    try {
      // Animate progress to 80% during upload, then handle parse
      const fakeTimer = setInterval(() => {
        setProgress((p) => (p < 80 ? p + 4 : p));
      }, 120);
      const job = await uploadInventoryFile(file, (p) => setProgress(Math.max(20, Math.min(p, 80))));
      clearInterval(fakeTimer);
      setProgress(100);
      setStatus("parsed");
      inventoryStore.setJob(job);
      toast.success(`Parsed ${job.row_count} SKUs · ${job.kpis.high_risk_skus} at high risk`);
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "Upload failed";
      toast.error(msg);
      setStatus("error");
      inventoryStore.setError(msg);
    }
  }

  function reset() {
    setFile(null);
    setProgress(0);
    setStatus("idle");
    inventoryStore.reset();
  }

  const isUploading = status === "uploading" || isLoading;
  const isParsed = status === "parsed";

  return (
    <div className="relative">
      {/* Tactical grid background */}
      <div className="absolute inset-0 tactical-grid opacity-30 pointer-events-none rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-emerald-500/[0.04] pointer-events-none rounded-2xl" />

      <div
        data-testid={UPLOAD.dropzone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !file && fileRef.current?.click()}
        className={[
          "relative rounded-2xl border-2 border-dashed transition-all p-8 sm:p-12",
          "min-h-[420px] flex flex-col items-center justify-center text-center",
          file
            ? "border-cyan-500/60 bg-slate-900/70"
            : "border-slate-700 bg-slate-900/40 hover:border-cyan-500/70 hover:bg-slate-900/70 cursor-pointer",
        ].join(" ")}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          data-testid={UPLOAD.input}
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {!file && (
          <>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center glow-cyan">
                <UploadCloud className="w-7 h-7 text-cyan-600 dark:text-cyan-300" strokeWidth={1.8} />
              </div>
            </div>
            <h2 className="mt-6 font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              Drop your Blinkit inventory file
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 max-w-md">
              Upload the latest <span className="font-mono-num text-cyan-600 dark:text-cyan-300">.xlsx</span> export.
              We&apos;ll parse warehouse stock, sales velocity, and lead times to surface replenishment intelligence.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button
                data-testid="open-file-picker"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold glow-cyan"
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Select Excel File
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500">or drag & drop</span>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 text-left max-w-2xl w-full">
              {[
                { k: "01", t: "Parse", d: "Multi-sheet ingestion" },
                { k: "02", t: "Analyze", d: "Risk + days-left model" },
                { k: "03", t: "Recommend", d: "Quantity-to-send per SKU" },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/40 dark:bg-slate-900/40 p-3">
                  <div className="font-mono-num text-[11px] text-cyan-600 dark:text-cyan-300">{s.k}</div>
                  <div className="mt-1 font-display font-bold text-sm text-slate-900 dark:text-slate-100">{s.t}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-0.5">{s.d}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {file && (
          <div className="w-full max-w-xl" data-testid={UPLOAD.status}>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{file.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-mono-num">
                  {(file.size / 1024).toFixed(1)} KB · ready
                </div>
              </div>
              {isParsed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>

            {(isUploading || progress > 0) && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-bold">
                    {isParsed ? "Processed" : isUploading ? "Processing" : "Ready"}
                  </span>
                  <span className="font-mono-num text-cyan-600 dark:text-cyan-300">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-slate-200 dark:bg-slate-800" />
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              {!isParsed && (
                <Button
                  data-testid={UPLOAD.generate}
                  disabled={isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerate();
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold glow-cyan disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating recommendations
                    </>
                  ) : (
                    <>Generate Recommendations</>
                  )}
                </Button>
              )}
              {isParsed && (
                <div className="text-sm text-emerald-600 dark:text-emerald-300 font-mono-num">
                  ✓ Recommendations ready — scroll down
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
