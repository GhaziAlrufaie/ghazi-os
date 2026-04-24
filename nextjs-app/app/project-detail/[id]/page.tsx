export const dynamic = 'force-dynamic';
// Server Component — Project Detail Page
// يعرض تفاصيل مشروع واحد + Kanban مهامه
import { createServerClient } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProjectDetailClient from '@/components/project-detail/ProjectDetailClient';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import type { BrandRow } from '@/lib/brands-types';
import type { ProjectRow } from '@/lib/projects-types';



async function getData(id: string) {
  const supabase = createServerClient();
  const [projRes, tasksRes, brandsRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase
      .from('tasks')
      .select('id,title,description,status,priority,due_date,brand_id,project_id,sort_order,subtasks')
      .eq('project_id', id)
      .order('sort_order'),
    supabase.from('brands').select('id,name,name_en,color,icon,status,health_score,description,production_days,nav_order,main_tab_label').order('nav_order'),
  ]);

  if (projRes.error || !projRes.data) return null;

  const r = projRes.data;
  const project: ProjectRow = {
    id: r.id,
    brandId: r.brand_id ?? null,
    title: r.title,
    description: r.description ?? '',
    status: r.status,
    priority: r.priority,
    startDate: r.start_date ?? null,
    targetDate: r.target_date ?? null,
    progress: r.progress ?? 0,
    tags: r.tags ?? [],
    sortOrder: r.sort_order ?? 0,
    updatedAt: r.updated_at ?? null,
  };

  const tasks: Task[] = (tasksRes.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate: row.due_date ?? null,
    brandId: row.brand_id ?? null,
    projectId: row.project_id ?? null,
    sortOrder: row.sort_order ?? 0,
    hasDescription: !!(row.description?.trim()),
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
  }));

  const brands: BrandRow[] = (brandsRes.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    nameEn: b.name_en ?? '',
    color: b.color ?? '#888',
    icon: b.icon ?? '📦',
    status: (b.status ?? 'active') as 'active' | 'paused' | 'archived',
    healthScore: b.health_score ?? 0,
    description: b.description ?? '',
    productionDays: b.production_days ?? 0,
    navOrder: b.nav_order ?? 0,
    mainTabLabel: b.main_tab_label ?? null,
  }));

  return { project, tasks, brands };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  if (!data) notFound();
  return (
    <ProjectDetailClient
      project={data.project}
      initialTasks={data.tasks}
      brands={data.brands}
    />
  );
}
