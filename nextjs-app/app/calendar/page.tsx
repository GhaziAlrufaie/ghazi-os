// Legendary Edition — Calendar Page (Server Component)
// جلب الأحداث والمهام ذات التواريخ من Supabase ثم تسليمها للـ Client

import { createServerClient } from '@/lib/supabase';
import CalendarClient from '@/components/calendar/CalendarClient';

export const dynamic = 'force-dynamic';

export interface CalEvent {
  id: string;
  title: string;
  day: number;
  month: number;
  year: number;
  brandId: string | null;
  type: string;
}

export interface CalTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  brandId: string | null;
  brandName: string | null;
  brandColor: string | null;
}

export interface Brand {
  id: string;
  name: string;
  color: string;
}

export default async function CalendarPage() {
  const supabase = createServerClient();

  const [eventsRes, tasksRes, brandsRes] = await Promise.all([
    supabase.from('events').select('*').order('day'),
    supabase
      .from('tasks')
      .select('id, title, due_date, status, brand_id')
      .not('due_date', 'is', null),
    supabase.from('brands').select('id, name, color'),
  ]);

  const brandsMap: Record<string, Brand> = {};
  (brandsRes.data ?? []).forEach((b) => {
    brandsMap[b.id] = { id: b.id, name: b.name, color: b.color };
  });

  const events: CalEvent[] = (eventsRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    day: r.day,
    month: r.month,
    year: r.year,
    brandId: r.brand_id ?? null,
    type: r.type ?? 'event',
  }));

  const tasks: CalTask[] = (tasksRes.data ?? []).map((r) => {
    const brand = r.brand_id ? brandsMap[r.brand_id] : null;
    return {
      id: r.id,
      title: r.title,
      dueDate: r.due_date,
      status: r.status,
      brandId: r.brand_id ?? null,
      brandName: brand?.name ?? null,
      brandColor: brand?.color ?? null,
    };
  });

  const brands: Brand[] = Object.values(brandsMap);

  return (
    <CalendarClient
      initialEvents={events}
      initialTasks={tasks}
      brands={brands}
    />
  );
}
