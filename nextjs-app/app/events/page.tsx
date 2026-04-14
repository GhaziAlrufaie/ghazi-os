// Server Component — Events Page
// يجلب الأحداث والبراندات من Supabase ويمررها للـ Client
import { getEvents } from '@/lib/events-actions';
import { createServerClient } from '@/lib/supabase';
import EventsClient from '@/components/events/EventsClient';
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const supabase = createServerClient();
  const [events, brandsRes] = await Promise.all([
    getEvents(),
    supabase.from('brands').select('id, name, color').order('nav_order'),
  ]);
  const brands = (brandsRes.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    color: b.color,
  }));
  return <EventsClient initialEvents={events} brands={brands} />;
}
