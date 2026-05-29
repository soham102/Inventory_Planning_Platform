import { PageHeader } from "@/components/common/PageHeader";
import { Settings as SettingsIcon, Bell, Database, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Settings" subtitle="Configure replenishment thresholds and integrations." tag="CONFIG" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card icon={SettingsIcon} title="Replenishment Parameters">
          <Field label="Buffer days" value="3" hint="Extra days of cover above lead time" />
          <Field label="Target days of inventory" value="14" hint="Used for max inventory targeting" />
          <Field label="Default lead time" value="5d" hint="When city not in mapping" />
        </Card>

        <Card icon={Bell} title="Alerts">
          <Toggle label="Slack alerts for HIGH risk SKUs" defaultChecked />
          <Toggle label="Email digest (daily)" defaultChecked />
          <Toggle label="Auto-place orders when qty-to-send > 0" />
        </Card>

        <Card icon={Database} title="Data Sources">
          <Field label="Connected source" value="Manual Excel upload" />
          <Field label="Lead time mapping" value="9 cities mapped" />
        </Card>

        <Card icon={KeyRound} title="AI Reasoning Engine">
          <Field label="Provider" value="Anthropic · Claude Sonnet" />
          <Field label="Key" value="EMERGENT_LLM_KEY · ******" mono />
          <Field label="Per-row latency" value="~1.2s" />
        </Card>
      </div>
    </div>
  );
}

const Card = ({ icon: Icon, title, children }) => (
  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
        <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
      </div>
      <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const Field = ({ label, value, hint, mono }) => (
  <div className="flex items-start justify-between gap-4 py-1">
    <div>
      <div className="text-sm text-slate-800 dark:text-slate-200">{label}</div>
      {hint && <div className="text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-0.5">{hint}</div>}
    </div>
    <div className={`text-sm ${mono ? "font-mono-num" : ""} text-cyan-300`}>{value}</div>
  </div>
);

const Toggle = ({ label, defaultChecked }) => (
  <div className="flex items-center justify-between py-1">
    <div className="text-sm text-slate-800 dark:text-slate-200">{label}</div>
    <Switch defaultChecked={defaultChecked} />
  </div>
);
