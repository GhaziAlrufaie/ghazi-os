// Server Component — Brand Detail Page
// يجلب بيانات البراند + مهامه + مشاريعه من Supabase
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import type { BrandRow } from '@/lib/brands-types';
import type { Task } from '@/lib/tasks-actions';
import type { ProjectRow } from '@/lib/projects-types';
import BrandDetailClient from '@/components/brands/BrandDetailClient';

interface PageProps {
  params: { id: string };
}

async function getBrand(id: string): Promise<BrandRow | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    nameEn: data.name_en ?? '',
    color: data.color ?? '#C9A84C',
    icon: data.icon ?? '🏷',
    status: data.status ?? 'active',
    description: data.description ?? '',
    productionDays: data.production_days ?? 7,
    healthScore: data.health_score ?? 0,
    navOrder: data.nav_order ?? 99,
    mainTabLabel: data.main_tab_label ?? null,
  };
}

async function getBrandTasks(brandId: string): Promise<Task[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('brand_id', brandId)
    .order('sort_order');
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    status: r.status ?? 'todo',
    priority: r.priority ?? 'medium',
    dueDate: r.due_date ?? null,
    brandId: r.brand_id ?? null,
    projectId: r.project_id ?? null,
    sortOrder: r.sort_order ?? 0,
    hasDescription: !!(r.description?.trim()),
  }));
}

async function getBrandProjects(brandId: string): Promise<ProjectRow[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('brand_id', brandId)
    .order('sort_order');
  return (data ?? []).map((r) => ({
    id: r.id,
    brandId: r.brand_id ?? null,
    title: r.title,
    description: r.description ?? '',
    status: r.status ?? 'planning',
    priority: r.priority ?? 'medium',
    startDate: r.start_date ?? null,
    targetDate: r.target_date ?? null,
    progress: r.progress ?? 0,
    tags: r.tags ?? [],
    sortOrder: r.sort_order ?? 0,
    updatedAt: r.updated_at ?? null,
  }));
}

export default async function BrandDetailPage({ params }: PageProps) {
  const [brand, tasks, projects] = await Promise.all([
    getBrand(params.id),
    getBrandTasks(params.id),
    getBrandProjects(params.id),
  ]);

  if (!brand) notFound();

  return (
    <BrandDetailClient
      brand={brand}
      initialTasks={tasks}
      initialProjects={projects}
    />
  );
}
