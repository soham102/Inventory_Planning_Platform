import { useMemo, useState, Fragment } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DASH } from "@/constants/testIds";
import { fetchReasoning } from "@/lib/api";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const RiskBadge = ({ risk }) => {
  const map = {
    HIGH: "bg-red-500/10 text-red-300 border-red-500/40",
    MEDIUM: "bg-amber-500/10 text-amber-300 border-amber-500/40",
    LOW: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${map[risk] || ""}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          risk === "HIGH" ? "bg-red-400 animate-pulse-dot" : risk === "MEDIUM" ? "bg-amber-400" : "bg-emerald-400"
        }`}
      />
      {risk}
    </span>
  );
};

const AlertBadge = ({ alert }) => {
  if (alert === "PLACE ORDER")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40">
        PLACE ORDER
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
      NO ACTION
    </span>
  );
};

export const RecommendationsTable = ({ jobId, rows = [], initialRisk = "ALL", initialAlert = "ALL", initialCity = "ALL" }) => {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState(initialRisk);
  const [alertFilter, setAlertFilter] = useState(initialAlert);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [reasoningMap, setReasoningMap] = useState({}); // key: idx -> text | "loading"

  const cities = useMemo(() => {
    const set = new Set();
    for (const r of rows) if (r.city) set.add(r.city);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (riskFilter !== "ALL" && r.stockout_risk !== riskFilter) return false;
      if (alertFilter !== "ALL" && r.alert !== alertFilter) return false;
      if (cityFilter !== "ALL" && r.city !== cityFilter) return false;
      if (!q) return true;
      return (
        String(r.item_id).toLowerCase().includes(q) ||
        String(r.warehouse_name).toLowerCase().includes(q) ||
        String(r.city).toLowerCase().includes(q)
      );
    });
  }, [rows, search, riskFilter, alertFilter, cityFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function loadReasoning(globalIdx, row) {
    if (reasoningMap[globalIdx]) return;
    setReasoningMap((m) => ({ ...m, [globalIdx]: "loading" }));
    try {
      const text = await fetchReasoning(jobId, row);
      setReasoningMap((m) => ({ ...m, [globalIdx]: text }));
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "AI reasoning failed";
      toast.error(msg);
      setReasoningMap((m) => {
        const next = { ...m };
        delete next[globalIdx];
        return next;
      });
    }
  }

  function toggleRow(globalIdx, row) {
    setExpanded(expanded === globalIdx ? null : globalIdx);
    if (expanded !== globalIdx) loadReasoning(globalIdx, row);
  }

  return (
    <div
      data-testid={DASH.table}
      className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
    >
      <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Replenishment Recommendations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500">
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} SKU-warehouse pairs
          </p>
        </div>

        <div className="sm:ml-auto flex flex-col sm:flex-row items-stretch gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 dark:text-slate-500" />
            <Input
              data-testid={DASH.search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search SKU, warehouse, city..."
              className="bg-transparent border-0 h-7 p-0 text-sm placeholder:text-slate-500 focus-visible:ring-0"
            />
          </div>

          <Select
            value={cityFilter}
            onValueChange={(v) => {
              setCityFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger data-testid="filter-city" className="h-9 w-full sm:w-36 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 max-h-72">
              <SelectItem value="ALL">All Cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={riskFilter}
            onValueChange={(v) => {
              setRiskFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger data-testid={DASH.filterRisk} className="h-9 w-full sm:w-36 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              <SelectItem value="ALL">All Risks</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={alertFilter}
            onValueChange={(v) => {
              setAlertFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger data-testid="filter-alert" className="h-9 w-full sm:w-40 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              <SelectValue placeholder="Alert" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              <SelectItem value="ALL">All Alerts</SelectItem>
              <SelectItem value="PLACE ORDER">Place Order</SelectItem>
              <SelectItem value="NO ACTION">No Action</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-[640px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10">
            <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">SKU</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">Warehouse</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">City</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-right">Stock</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-right">Incoming</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-right">Days Left</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-right">Lead</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-right">Qty Send</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">Risk</TableHead>
              <TableHead className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">Alert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((r, i) => {
              const globalIdx = page * PAGE_SIZE + i;
              const rowKey = `${r.warehouse_id}-${r.item_id}-${globalIdx}`;
              const isOpen = expanded === globalIdx;
              const reasoning = reasoningMap[globalIdx];
              return (
                <Fragment key={rowKey}>
                  <TableRow
                    data-testid={`row-${globalIdx}`}
                    className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => toggleRow(globalIdx, r)}
                  >
                    <TableCell className="py-2">
                      <button
                        data-testid={`${DASH.rowExpand}-${globalIdx}`}
                        className="w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="font-mono-num text-slate-900 dark:text-slate-100 text-sm">#{r.item_id}</TableCell>
                    <TableCell className="text-slate-800 dark:text-slate-200 text-sm truncate max-w-[180px]">{r.warehouse_name}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400 text-sm">{r.city}</TableCell>
                    <TableCell className="font-mono-num text-right text-sm text-slate-800 dark:text-slate-200">{r.current_stock}</TableCell>
                    <TableCell className="font-mono-num text-right text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">{r.incoming_stock}</TableCell>
                    <TableCell className="font-mono-num text-right text-sm">
                      <span
                        className={
                          r.stockout_risk === "HIGH"
                            ? "text-red-300"
                            : r.stockout_risk === "MEDIUM"
                              ? "text-amber-300"
                              : "text-emerald-300"
                        }
                      >
                        {Number(r.days_of_inventory_left).toFixed(1)}d
                      </span>
                    </TableCell>
                    <TableCell className="font-mono-num text-right text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">{r.lead_time_days}d</TableCell>
                    <TableCell className="font-mono-num text-right text-sm font-bold text-cyan-600 dark:text-cyan-300">
                      {r.quantity_to_send > 0 ? r.quantity_to_send : "—"}
                    </TableCell>
                    <TableCell><RiskBadge risk={r.stockout_risk} /></TableCell>
                    <TableCell><AlertBadge alert={r.alert} /></TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
                      <TableCell colSpan={11} className="p-0">
                        <div
                          data-testid={DASH.aiReasoning}
                          className="border-l-2 border-cyan-400 bg-slate-100/60 dark:bg-slate-800/30 p-4 m-2 rounded-r-lg"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
                            <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-cyan-600 dark:text-cyan-300">
                              AI Reasoning · Claude Sonnet
                            </div>
                          </div>
                          {!reasoning || reasoning === "loading" ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 dark:text-slate-500 dark:text-slate-400">
                              <Loader2 className="w-4 h-4 animate-spin" /> Generating reasoning…
                            </div>
                          ) : (
                            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{reasoning}</p>
                          )}
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                            <Stat label="Daily sales" value={`${r.daily_sales}/d`} />
                            <Stat label="Total avail" value={r.total_inventory} />
                            <Stat label="Min / Max" value={`${r.min_inventory} / ${r.max_inventory}`} />
                            <Stat label="Days left" value={`${Number(r.days_of_inventory_left).toFixed(1)}d`} />
                            <Stat label="Send" value={r.quantity_to_send} accent />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {!pageRows.length && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-slate-500 dark:text-slate-500 dark:text-slate-500">
                  No recommendations match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-mono-num">
          Page {page + 1} of {pageCount}
        </div>
        <div className="flex gap-2">
          <Button
            data-testid={DASH.pagePrev}
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            data-testid={DASH.pageNext}
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <div className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
    <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold">{label}</div>
    <div className={`font-mono-num text-sm mt-0.5 ${accent ? "text-cyan-600 dark:text-cyan-300 font-bold" : "text-slate-900 dark:text-slate-100"}`}>{value}</div>
  </div>
);
