import { getMetrics, getMonthlyGoals, getCampaigns } from '@/lib/performance-actions';
import { getBrands } from '@/lib/brands-actions';
import PerformanceClient from '@/components/performance/PerformanceClient';

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const [metrics, goals, campaigns, brands] = await Promise.all([
    getMetrics(),
    getMonthlyGoals(),
    getCampaigns(),
    getBrands(),
  ]);

  const brandsMapped = brands.map(b => ({
    id: b.id,
    name: b.name,
    icon: b.icon ?? '🏷',
  }));

  return (
    <PerformanceClient
      metrics={metrics as Parameters<typeof PerformanceClient>[0]['metrics']}
      goals={goals as Parameters<typeof PerformanceClient>[0]['goals']}
      campaigns={campaigns as Parameters<typeof PerformanceClient>[0]['campaigns']}
      brands={brandsMapped}
    />
  );
}
