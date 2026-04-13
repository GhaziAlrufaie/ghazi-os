'use server';
// Server Actions — Tasks (tasks table)

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type TaskStatus = 'todo' | 'in_progress' | 'on_hold' | 'done';
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
