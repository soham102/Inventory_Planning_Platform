import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { ArrowRight } from "lucide-react";

export const EmptyState = ({ icon: Icon, title, hint }) => (
  <div className="space-y-6 animate-fade-up">
    <PageHeader title={title} subtitle={hint} tag="STANDBY" />
    <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 flex flex-col items-center justify-center text-center min-h-[420px] relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-30 pointer-events-none" />
      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative">
        <Icon className="w-6 h-6 text-cyan-300" />
      </div>
      <div className="mt-5 font-display text-xl font-bold text-slate-100 relative">
        No data yet
      </div>
      <p className="mt-1 text-sm text-slate-400 max-w-md relative">{hint}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold glow-cyan relative"
      >
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
);
