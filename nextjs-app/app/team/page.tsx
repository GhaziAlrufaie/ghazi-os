import { getEmployees } from '@/lib/team-actions';
import { getExpenseSections } from '@/lib/expenses-actions';
import TeamClient from '@/components/team/TeamClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function getBrands() {
  const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await sb.from('brands').select('id, name').order('name');
  return (data ?? []) as { id: string; name: string }[];
}

export default async function TeamPage() {
  const [employees, brands] = await Promise.all([
    getEmployees(),
    getBrands(),
  ]);
  return <TeamClient employees={employees} brands={brands} />;
}
