// Server Component — Tasks page
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';
import TasksClient from '@/components/tasks/TasksClient';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import type { BrandRow } from '@/lib/brands-types';

async function fetchData() {
  const supabase = createServerClient();
  const [tasksRes, brandsRes, projectsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id,title,description,status,priority,due_date,brand_id,project_id,sort_order,subtasks,blocker_reason')
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false }),
    supabase.from('brands').select('id,name,name_en,color,icon,status,health_score,description,production_days,nav_order,main_tab_label').order('nav_order'),
    supabase.from('projects').select('id,title,brand_id').order('title'),
  ]);

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
    blockerReason: (row.blocker_reason ?? null) as string | null,
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
  return {
    tasks,
    brands,
    projects: projectsRes.data ?? [],
  };
}

export default async function TasksPage() {
  const { tasks, brands, projects } = await fetchData();
  return (
    <TasksClient initialTasks={tasks} brands={brands} projects={projects} />
  );
}
