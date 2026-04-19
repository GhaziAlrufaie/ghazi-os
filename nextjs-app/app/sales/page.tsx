import { getSallaOrders } from '@/lib/sales-actions';
import SalesClient from '@/components/sales/SalesClient';
export const dynamic = 'force-dynamic';
export default async function SalesPage() {
  const orders = await getSallaOrders().catch(() => []);
  return <SalesClient orders={orders} />;
}
