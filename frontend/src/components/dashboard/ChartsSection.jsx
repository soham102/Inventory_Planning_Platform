import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { DASH } from "@/constants/testIds";
import { useTheme, chartTokens } from "@/lib/theme";

const PanelHeader = ({ title, sub, accent = "text-cyan-600 dark:text-cyan-300" }) => (
  <div className="flex items-start justify-between mb-3">
    <div>
      <div className={`text-[10px] uppercase tracking-[0.18em] font-bold ${accent}`}>{sub}</div>
      <div className="font-display text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</div>
    </div>
  </div>
);

const Panel = ({ children, className = "", tid }) => (
  <div
    data-testid={tid}
    className={`rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors p-4 ${className}`}
  >
    {children}
  </div>
);

const STATUS_COLORS = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981" };
const PIE_COLORS = ["#EF4444", "#F59E0B", "#10B981"];

export const ChartsSection = ({ charts }) => {
  const { theme } = useTheme();
  const t = chartTokens(theme);
  const tooltipStyle = {
    background: t.tooltipBg,
    border: `1px solid ${t.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 12,
    color: t.tooltipText,
    boxShadow: theme === "dark"
      ? "0 10px 25px rgba(0,0,0,0.45)"
      : "0 10px 25px rgba(15,23,42,0.08)",
  };
  const tooltipLabel = { color: t.tooltipLabel, fontWeight: 600 };
  const tooltipItem = { color: t.tooltipText };
  const legendStyle = { fontSize: 11, color: t.legend };

  const cityData = charts?.city_inventory ?? [];
  const riskData = charts?.risk_distribution ?? [];
  const topRisky = charts?.top_risky_skus ?? [];
  const qtyByCity = charts?.qty_by_city ?? [];
  const leadVsInv = charts?.lead_vs_inv ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Panel className="lg:col-span-2" tid={DASH.chartCity}>
        <PanelHeader title="City-wise Inventory Health" sub="Stockout risk by city" />
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={cityData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="city" tick={{ fill: t.tickPrimary, fontSize: 11 }} tickLine={false} axisLine={{ stroke: t.axis }} />
              <YAxis tick={{ fill: t.tickMuted, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} cursor={{ fill: t.cursorFill }} />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="high_risk_count" name="High" stackId="r" fill={STATUS_COLORS.HIGH} radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium_risk_count" name="Medium" stackId="r" fill={STATUS_COLORS.MEDIUM} />
              <Bar dataKey="low_risk_count" name="Low" stackId="r" fill={STATUS_COLORS.LOW} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="lg:col-span-1" tid={DASH.chartRiskPie}>
        <PanelHeader title="Stockout Risk Mix" sub="Distribution across SKUs" />
        <div className="h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={riskData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                stroke={t.tooltipBg}
                strokeWidth={2}
                paddingAngle={2}
              >
                {riskData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} />
              <Legend wrapperStyle={legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="lg:col-span-2" tid={DASH.chartTopRisky}>
        <PanelHeader title="Top Risky SKUs" sub="Highest replenishment urgency" />
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={topRisky} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={t.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: t.tickMuted, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="sku" tick={{ fill: t.tickPrimary, fontSize: 10 }} tickLine={false} axisLine={false} width={140} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} cursor={{ fill: t.cursorFill }} />
              <Bar dataKey="qty_to_send" name="Qty to send" fill={t.accentCyan} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="lg:col-span-3" tid={DASH.chartQty}>
        <PanelHeader title="Quantity to Send · By City" sub="Replenishment volume" accent="text-emerald-600 dark:text-emerald-300" />
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={qtyByCity} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="city" tick={{ fill: t.tickPrimary, fontSize: 11 }} tickLine={false} axisLine={{ stroke: t.axis }} />
              <YAxis tick={{ fill: t.tickMuted, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} />
              <Line
                type="monotone"
                dataKey="quantity_to_send"
                name="Qty"
                stroke={t.accentEmerald}
                strokeWidth={2.5}
                dot={{ fill: t.accentEmerald, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: t.accentEmerald, strokeWidth: 2, fill: t.accentDotStroke }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="lg:col-span-2" tid={DASH.chartLeadTime}>
        <PanelHeader title="Lead Time vs Inventory Days" sub="By city · comparison" accent="text-amber-600 dark:text-amber-300" />
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={leadVsInv} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="city" tick={{ fill: t.tickPrimary, fontSize: 11 }} tickLine={false} axisLine={{ stroke: t.axis }} />
              <YAxis tick={{ fill: t.tickMuted, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} cursor={{ fill: t.cursorFill }} />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="lead_time" name="Lead time (d)" fill={t.accentAmber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_days_left" name="Inventory days" fill={t.accentCyan} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
};

export { STATUS_COLORS };
