import { getDecisions, getEmployees } from '@/lib/leadership-actions';
import { getBrands } from '@/lib/brands-actions';
import { getInboxTasks } from '@/lib/inbox-actions';
import { createServerClient } from '@/lib/supabase';
import LeadershipClient from '@/components/leadership/LeadershipClient';
import type { WeeklyFocusEntry, FocusTargetType } from '@/lib/weekly-focus-actions';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function generateMetadata() {
  return {
    other: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'CDN-Cache-Control': 'no-store',
    },
  };
}

async function fetchWeeklyFocus(): Promise<WeeklyFocusEntry[]> {
  const supabase = createServerClient();
  const from = new Date();
  from.setDate(from.getDate() - 1);
  const to = new Date();
  to.setDate(to.getDate() + 7);
  const { data } = await supabase
    .from('weekly_focus')
    .select('id,focus_date,target_type,target_id,target_name,target_color,notes')
    .gte('focus_date', from.toISOString().split('T')[0])
    .lte('focus_date', to.toISOString().split('T')[0])
    .order('focus_date', { ascending: true });
  return (data ?? []).map((row) => ({
    id: row.id,
    focusDate: row.focus_date,
    targetType: (row.target_type ?? 'brand') as FocusTargetType,
    targetId: row.target_id ?? null,
    targetName: row.target_name ?? '',
    targetColor: row.target_color ?? '#C9A84C',
    notes: row.notes ?? '',
  }));
}

async function fetchTodaySales(): Promise<number> {
  try {
    const supabase = createServerClient();
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('salla_orders')
      .select('total_amount')
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59')
      .neq('status', 'cancelled');
    return (data ?? []).reduce((sum: number, r: { total_amount?: number }) => sum + (r.total_amount ?? 0), 0);
  } catch { return 0; }
}

async function fetchUpcomingEvents() {
  const supabase = createServerClient();
  const now = new Date();
  const { data } = await supabase
    .from('events')
    .select('id,title,day,month,year,brand_id')
    .order('year').order('month').order('day');
  const brandsRes = await supabase.from('brands').select('id,name,color');
  const brandsMap: Record<string, { name: string; color: string }> = {};
  (brandsRes.data ?? []).forEach((b: { id: string; name: string; color: string }) => { brandsMap[b.id] = { name: b.name, color: b.color }; });
  return (data ?? [])
    .filter((e: { year: number; month: number; day: number }) => {
      const d = new Date(e.year, e.month - 1, e.day);
      return d >= now;
    })
    .slice(0, 5)
    .map((e: { id: string; title: string; day: number; month: number; year: number; brand_id: string | null }) => ({
      id: e.id,
      title: e.title,
      day: e.day,
      month: e.month,
      year: e.year,
      brandId: e.brand_id ?? null,
      brandName: e.brand_id ? (brandsMap[e.brand_id]?.name ?? null) : null,
      brandColor: e.brand_id ? (brandsMap[e.brand_id]?.color ?? null) : null,
    }));
}

async function fetchActiveTasks() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('tasks')
    .select('id,title,status,priority,brand_id,due_date')
    .in('status', ['todo', 'in_progress'])
    .order('sort_order', { ascending: true })
    .limit(10);
  const brandsRes = await supabase.from('brands').select('id,name,color');
  const brandsMap: Record<string, { name: string; color: string }> = {};
  (brandsRes.data ?? []).forEach((b: { id: string; name: string; color: string }) => { brandsMap[b.id] = { name: b.name, color: b.color }; });
  return (data ?? []).map((t: { id: string; title: string; status: string; priority: string; brand_id: string | null; due_date: string | null }) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    brandId: t.brand_id ?? null,
    brandName: t.brand_id ? (brandsMap[t.brand_id]?.name ?? null) : null,
    brandColor: t.brand_id ? (brandsMap[t.brand_id]?.color ?? null) : null,
    dueDate: t.due_date ?? null,
  }));
}

async function fetchDailyTasks(): Promise<string[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'DAILY_TASKS')
      .single();
    if (data?.value && Array.isArray(data.value)) return data.value as string[];
    return [];
  } catch { return []; }
}

export default async function LeadershipPage() {
  const [decisions, employees, brands, inboxTasks, weeklyFocus, todaySales, upcomingEvents, activeTasks, dailyTasks] = await Promise.all([
    getDecisions(),
    getEmployees(),
    getBrands(),
    getInboxTasks(),
    fetchWeeklyFocus(),
    fetchTodaySales(),
    fetchUpcomingEvents(),
    fetchActiveTasks(),
    fetchDailyTasks(),
  ]);

  const brandsMapped = brands.map(b => ({
    id: b.id,
    name: b.name,
    icon: b.icon ?? '🏷',
    color: b.color ?? '#C9963B',
  }));

  return (
    <LeadershipClient
      decisions={decisions as Parameters<typeof LeadershipClient>[0]['decisions']}
      employees={employees as Parameters<typeof LeadershipClient>[0]['employees']}
      brands={brandsMapped}
      inboxTasks={inboxTasks}
      weeklyFocus={weeklyFocus}
      todaySales={todaySales}
      upcomingEvents={upcomingEvents}
      activeTasks={activeTasks}
      dailyTasks={dailyTasks}
    />
  );
}
