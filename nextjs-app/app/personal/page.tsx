// Server Component — Personal Tasks page
export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import PersonalClient from '@/components/personal/PersonalClient';
import type { PersonalTask, TaskStatus, TaskPriority, TaskCategory } from '@/lib/personal-actions';

async function fetchPersonalTasks(): Promise<PersonalTask[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('personal_tasks')
    .select('id,title,description,status,priority,category,due_date,sort_order')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    category: (row.category ?? 'personal') as TaskCategory,
    dueDate: row.due_date ?? null,
    sortOrder: row.sort_order ?? 0,
    hasDescription: !!(row.description?.trim()),
  }));
}

export default async function PersonalPage() {
  const tasks = await fetchPersonalTasks();

  return (
    <div className="h-full p-6 overflow-hidden">
      <PersonalClient initialTasks={tasks} />
    </div>
  );
}
