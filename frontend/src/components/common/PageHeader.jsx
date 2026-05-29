import { Link } from "react-router-dom";

export const PageHeader = ({ title, subtitle, tag, right }) => (
  <div className="flex items-start justify-between gap-4 flex-wrap">
    <div>
      {tag && <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-600 dark:text-cyan-300">{tag}</div>}
      <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 mt-1">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{subtitle}</p>}
    </div>
    {right}
  </div>
);
