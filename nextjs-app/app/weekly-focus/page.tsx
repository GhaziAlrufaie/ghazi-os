// Server Component — Weekly Focus page
export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import WeeklyFocusClient from '@/components/weekly-focus/WeeklyFocusClient';
import type { WeeklyFocusEntry, FocusTargetType } from '@/lib/weekly-focus-actions';

async function fetchWeeklyFocus(): Promise<WeeklyFocusEntry[]> {
  const supabase = createServerClient();

  // Fetch last 30 days + next 30 days
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const to = new Date();
  to.setDate(to.getDate() + 30);

  const { data, error } = await supabase
    .from('weekly_focus')
    .select('id,focus_date,target_type,target_id,target_name,target_color,notes')
    .gte('focus_date', from.toISOString().split('T')[0])
    .lte('focus_date', to.toISOString().split('T')[0])
    .order('focus_date', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    focusDate: typeof row.focus_date === 'string' && row.focus_date.startsWith('{')
      ? JSON.parse(row.focus_date).date ?? row.focus_date
      : row.focus_date,
    targetType: (row.target_type ?? 'brand') as FocusTargetType,
    targetId: row.target_id ?? null,
    targetName: row.target_name ?? '',
    targetColor: row.target_color ?? '#C9A84C',
    notes: row.notes ?? '',
  }));
}

async function fetchBrands() {
  const supabase = createServerClient();
  const { data } = await supabase.from('brands').select('id,name,color').order('name');
  return data ?? [];
}

export default async function WeeklyFocusPage() {
  const [entries, brands] = await Promise.all([fetchWeeklyFocus(), fetchBrands()]);

  return (
    <div className="h-full p-6 overflow-hidden">
      <WeeklyFocusClient initialEntries={entries} brands={brands} />
    </div>
  );
}
