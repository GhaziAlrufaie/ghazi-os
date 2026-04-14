import { getDecisions, getEmployees } from '@/lib/leadership-actions';
import { getBrands } from '@/lib/brands-actions';
import LeadershipClient from '@/components/leadership/LeadershipClient';

export const dynamic = 'force-dynamic';

export default async function LeadershipPage() {
  const [decisions, employees, brands] = await Promise.all([
    getDecisions(),
    getEmployees(),
    getBrands(),
  ]);

  const brandsMapped = brands.map(b => ({
    id: b.id,
    name: b.name,
    icon: b.icon ?? '🏷',
  }));

  return (
    <LeadershipClient
      decisions={decisions as Parameters<typeof LeadershipClient>[0]['decisions']}
      employees={employees as Parameters<typeof LeadershipClient>[0]['employees']}
      brands={brandsMapped}
    />
  );
}
