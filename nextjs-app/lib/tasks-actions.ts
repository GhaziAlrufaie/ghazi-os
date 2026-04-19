'use server';
// Server Actions — Tasks (tasks table)

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type TaskStatus = 'todo' | 'in_progress' | 'on_hold' | 'waiting' | 'done' | 'ideas';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  brandId: string | null;
  projectId: string | null;
  sortOrder: number;
  hasDescription: boolean;
}

interface AddTaskInput {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  brandId?: string | null;
  projectId?: string | null;
}

interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  sortOrder?: number;
}

export async function getTasks(): Promise<Task[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('tasks')
    .select('id,title,description,status,priority,due_date,brand_id,project_id,sort_order')
    .order('sort_order');
  return (data ?? []).map(r => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string) ?? '',
    status: r.status as TaskStatus,
    priority: r.priority as TaskPriority,
    dueDate: (r.due_date as string | null) ?? null,
    brandId: (r.brand_id as string | null) ?? null,
    projectId: (r.project_id as string | null) ?? null,
    sortOrder: (r.sort_order as number) ?? 0,
    hasDescription: !!((r.description as string)?.trim()),
  }));
}

function genId(): string {
  return `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function addTask(
  input: AddTaskInput
): Promise<{ task?: Task; error?: string }> {
  const supabase = createServerClient();
  const id = genId();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      id,
      title: input.title,
      description: '',
      status: input.status,
      priority: input.priority,
      brand_id: input.brandId ?? null,
      project_id: input.projectId ?? null,
      sort_order: 0,
    })
    .select('id,title,description,status,priority,due_date,brand_id,project_id,sort_order')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/tasks');

  return {
    task: {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      dueDate: data.due_date ?? null,
      brandId: data.brand_id ?? null,
      projectId: data.project_id ?? null,
      sortOrder: data.sort_order ?? 0,
      hasDescription: !!(data.description?.trim()),
    },
  };
}

export async function updateTask(
  input: UpdateTaskInput
): Promise<{ task?: Task; error?: string }> {
  const supabase = createServerClient();

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined)       patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined)      patch.status = input.status;
  if (input.priority !== undefined)    patch.priority = input.priority;
  if (input.dueDate !== undefined)     patch.due_date = input.dueDate;
  if (input.sortOrder !== undefined)   patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', input.id)
    .select('id,title,description,status,priority,due_date,brand_id,project_id,sort_order')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/tasks');

  return {
    task: {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      dueDate: data.due_date ?? null,
      brandId: data.brand_id ?? null,
      projectId: data.project_id ?? null,
      sortOrder: data.sort_order ?? 0,
      hasDescription: !!(data.description?.trim()),
    },
  };
}

export async function deleteTask(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/tasks');
  return {};
}

export async function archiveTask(
  task: Task
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const now = new Date();

  // 1. أدرج في جدول archive
  const archiveRow = {
    id: `arc_tsk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'task',
    reason: 'manual',
    archived_at: now.toISOString(),
    archived_month: now.getMonth() + 1,
    archived_year: now.getFullYear(),
    data: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      brandId: task.brandId,
      projectId: task.projectId,
    },
  };

  const { error: archErr } = await supabase.from('archive').insert(archiveRow);
  if (archErr) return { error: archErr.message };

  // 2. احذف من tasks
  const { error: delErr } = await supabase.from('tasks').delete().eq('id', task.id);
  if (delErr) return { error: delErr.message };

  revalidatePath('/tasks');
  revalidatePath('/archive');
  return {};
}
