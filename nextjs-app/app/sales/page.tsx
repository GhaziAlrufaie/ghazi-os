import { getSallaOrders } from '@/lib/sales-actions';
import { getMetrics } from '@/lib/performance-actions';
import { getBrands } from '@/lib/brands-actions';
import SalesClient from '@/components/sales/SalesClient';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const [orders, metrics, brands] = await Promise.all([
    getSallaOrders(),
    getMetrics(),
    getBrands(),
  ]);

  const brandsMapped = brands.map(b => ({
    id: b.id,
    name: b.name,
    icon: b.icon ?? '🏷',
  }));

  return (
    <SalesClient
      orders={orders as Parameters<typeof SalesClient>[0]['orders']}
      metrics={metrics as Parameters<typeof SalesClient>[0]['metrics']}
      brands={brandsMapped}
    />
  );
}
