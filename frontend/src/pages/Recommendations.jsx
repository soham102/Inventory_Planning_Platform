import { useInventory } from "@/store/inventoryStore";
import { RecommendationsTable } from "@/components/dashboard/RecommendationsTable";
import { DownloadSection } from "@/components/dashboard/DownloadSection";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ListChecks } from "lucide-react";

export default function Recommendations() {
  const { job } = useInventory();
  if (!job) return <EmptyState icon={ListChecks} title="Recommendations" hint="Upload an inventory file from the Dashboard to see replenishment recommendations." />;
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Recommendations" subtitle="Every SKU-warehouse pair with quantity-to-send and AI reasoning." tag="REPLENISHMENT" />
      <RecommendationsTable jobId={job.job_id} rows={job.recommendations} />
      <DownloadSection jobId={job.job_id} rowCount={job.row_count} replenishQty={job.kpis.total_replenishment_qty} />
    </div>
  );
}
