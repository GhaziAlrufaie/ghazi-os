// Server Component — Tasks page
export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import TasksClient from '@/components/tasks/TasksClient';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';

async function fetchTasks(): Promise<Task[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('id,title,description,status,priority,due_date,brand_id,project_id,sort_order')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
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
  }));
}

async function fetchBrands() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('brands')
    .select('id,name,color')
    .order('name');
  return data ?? [];
}

export default async function TasksPage() {
  const [tasks, brands] = await Promise.all([fetchTasks(), fetchBrands()]);

  return (
    <div className="h-full p-6 overflow-hidden">
      <TasksClient initialTasks={tasks} brands={brands} />
    </div>
  );
}
