// Server Component — Brands Page
// يجلب البراندات + إحصائيات المهام والمشاريع من Supabase
import { createServerClient } from '@/lib/supabase';
import type { BrandRow } from '@/lib/brands-types';
import BrandsClient from '@/components/brands/BrandsClient';

export const dynamic = 'force-dynamic';

export interface BrandStats {
  openTasks: number;
  doneTasks: number;
  projects: number;
  decisions: number;
}

export default async function BrandsPage() {
  const supabase = createServerClient();

  const { data: brandsData } = await supabase
    .from('brands')
    .select('*')
    .order('nav_order');

  const brands: BrandRow[] = (brandsData ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    nameEn: (r.name_en as string) ?? '',
    color: (r.color as string) ?? '#C9963B',
    icon: (r.icon as string) ?? '🏷',
    status: (r.status as BrandRow['status']) ?? 'active',
    healthScore: (r.health_score as number) ?? 0,
    description: (r.description as string) ?? '',
    productionDays: (r.production_days as number) ?? 7,
    navOrder: (r.nav_order as number) ?? 99,
    mainTabLabel: (r.main_tab_label as string | null) ?? null,
  }));

  const brandIds = brands.map((b) => b.id);

  const [tasksRes, projectsRes, decisionsRes] = await Promise.all([
    supabase.from('tasks').select('brand_id, status').in('brand_id', brandIds),
    supabase.from('projects').select('brand_id').in('brand_id', brandIds),
    supabase.from('decisions').select('brand_id, status').in('brand_id', brandIds),
  ]);

  const tasks = tasksRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const decisions = decisionsRes.data ?? [];

  const statsMap: Record<string, BrandStats> = {};
  for (const brand of brands) {
    const bt = tasks.filter((t) => t.brand_id === brand.id);
    statsMap[brand.id] = {
      openTasks: bt.filter((t) => t.status !== 'done').length,
      doneTasks: bt.filter((t) => t.status === 'done').length,
      projects: projects.filter((p) => p.brand_id === brand.id).length,
      decisions: decisions.filter((d) => d.brand_id === brand.id && d.status === 'pending').length,
    };
  }

  return <BrandsClient initialBrands={brands} statsMap={statsMap} />;
}
