import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { DASH } from "@/constants/testIds";

const TOOLTIP_STYLE = {
  background: "#0F172A",
  border: "1px solid #334155",
  borderRadius: 8,
  fontSize: 12,
  color: "#F8FAFC",
  boxShadow: "0 10px 25px rgba(0,0,0,0.45)",
};

const TOOLTIP_LABEL = { color: "#94A3B8", fontWeight: 600 };
const TOOLTIP_ITEM = { color: "#F8FAFC" };

const STATUS_COLORS = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981" };
const PIE_COLORS = ["#EF4444", "#F59E0B", "#10B981"];

const PanelHeader = ({ title, sub, accent = "text-cyan-300" }) => (
  <div className="flex items-start justify-between mb-3">
    <div>
      <div className={`text-[10px] uppercase tracking-[0.18em] font-bold ${accent}`}>{sub}</div>
      <div className="font-display text-base font-bold text-slate-100 tracking-tight">{title}</div>
    </div>
  </div>
);

const Panel = ({ children, className = "", tid }) => (
  <div
    data-testid={tid}
    className={`rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors p-4 ${className}`}
  >
    {children}
  </div>
);

export const ChartsSection = ({ charts }) => {
  const cityData = charts?.city_inventory ?? [];
  const riskData = charts?.risk_distribution ?? [];
  const topRisky = charts?.top_risky_skus ?? [];
  const qtyByCity = charts?.qty_by_city ?? [];
  const leadVsInv = charts?.lead_vs_inv ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Row 1 */}
      <Panel className="lg:col-span-2" tid={DASH.chartCity}>
        <PanelHeader title="City-wise Inventory Health" sub="Stockout risk by city" />
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={cityData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="city" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1E293B" }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: "rgba(34,211,238,0.05)" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
              <Bar dataKey="high_risk_count" name="High" stackId="r" fill="#EF4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium_risk_count" name="Medium" stackId="r" fill="#F59E0B" />
              <Bar dataKey="low_risk_count" name="Low" stackId="r" fill="#10B981" radius={[4, 4, 0, 0]} />
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
                stroke="#0F172A"
                strokeWidth={2}
                paddingAngle={2}
              >
                {riskData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="lg:col-span-2" tid={DASH.chartTopRisky}>
        <PanelHeader title="Top Risky SKUs" sub="Highest replenishment urgency" />
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={topRisky} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="sku" tick={{ fill: "#94A3B8", fontSize: 10 }} tickLine={false} axisLine={false} width={140} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: "rgba(34,211,238,0.05)" }} />
              <Bar dataKey="qty_to_send" name="Qty to send" fill="#22D3EE" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Row 2 */}
      <Panel className="lg:col-span-3" tid={DASH.chartQty}>
        <PanelHeader title="Quantity to Send · By City" sub="Replenishment volume" accent="text-emerald-300" />
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={qtyByCity} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="city" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1E293B" }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
              <Line
                type="monotone"
                dataKey="quantity_to_send"
                name="Qty"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ fill: "#10B981", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2, fill: "#0F172A" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="lg:col-span-2" tid={DASH.chartLeadTime}>
        <PanelHeader title="Lead Time vs Inventory Days" sub="By city · comparison" accent="text-amber-300" />
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={leadVsInv} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="city" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1E293B" }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: "rgba(34,211,238,0.05)" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} />
              <Bar dataKey="lead_time" name="Lead time (d)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg_days_left" name="Inventory days" fill="#22D3EE" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
};

export { STATUS_COLORS };
