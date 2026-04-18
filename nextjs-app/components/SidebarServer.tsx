/*
 * Ghazi OS — SidebarServer
 * Server Component: يجلب البراندات من Supabase ويمررها لـ Sidebar Client
 */
import { createServerClient } from '@/lib/supabase';
import SidebarClient from '@/components/Sidebar';

async function fetchBrands() {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('brands')
      .select('id, name, color, icon, status, nav_order')
      .in('status', ['active', 'selling', 'paused'])
      .order('nav_order', { ascending: true });
    return (data ?? []).map((b: { id: string; name: string; color: string; icon: string; status: string }) => ({
      id: b.id,
      name: b.name,
      color: b.color ?? '#C9A84C',
      icon: b.icon ?? '🏷',
    }));
  } catch {
    return [];
  }
}

export default async function SidebarServer() {
  const brands = await fetchBrands();
  return <SidebarClient brands={brands} />;
}
