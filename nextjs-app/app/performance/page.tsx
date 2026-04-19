import { getMetrics } from "@/lib/performance-actions";
import { getBrands } from "@/lib/brands-actions";
import PerformanceClient from "@/components/performance/PerformanceClient";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const [metrics, brands] = await Promise.all([
    getMetrics(),
    getBrands(),
  ]);
  const brandsMapped = brands.map(b => ({
    id: b.id,
    name: b.name,
    color: b.color ?? "#C9A84C",
    icon: b.icon ?? "🏷",
  }));
  return (
    <PerformanceClient
      metrics={metrics}
      brands={brandsMapped}
    />
  );
}
