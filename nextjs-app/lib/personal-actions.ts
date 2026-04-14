'use server';
// Server Actions — Personal Tasks (personal_tasks table)

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type TaskStatus = 'todo' | 'in_progress' | 'on_hold' | 'done';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskCategory =
  | 'personal'
  | 'health'
  | 'family'
  | 'development'
  | 'financial'
  | 'ideas';

export interface PersonalTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string | null;
  sortOrder: number;
  hasDescription: boolean;
}

interface AddPersonalTaskInput {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
}

interface UpdatePersonalTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string | null;
  sortOrder?: number;
}

function genId(): string {
  return `pt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function addPersonalTask(
  input: AddPersonalTaskInput
): Promise<{ task?: PersonalTask; error?: string }> {
  const supabase = createServerClient();
  const id = genId();

  const { data, error } = await supabase
    .from('personal_tasks')
    .insert({
      id,
      title: input.title,
      description: '',
      status: input.status,
      priority: input.priority,
      category: input.category,
      sort_order: 0,
    })
    .select('id,title,description,status,priority,category,due_date,sort_order')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/personal');

  return { task: mapRow(data) };
}

export async function updatePersonalTask(
  input: UpdatePersonalTaskInput
): Promise<{ task?: PersonalTask; error?: string }> {
  const supabase = createServerClient();

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined)       patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined)      patch.status = input.status;
  if (input.priority !== undefined)    patch.priority = input.priority;
  if (input.category !== undefined)    patch.category = input.category;
  if (input.dueDate !== undefined)     patch.due_date = input.dueDate;
  if (input.sortOrder !== undefined)   patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from('personal_tasks')
    .update(patch)
    .eq('id', input.id)
    .select('id,title,description,status,priority,category,due_date,sort_order')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/personal');

  return { task: mapRow(data) };
}

export async function deletePersonalTask(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('personal_tasks').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/personal');
  return {};
}

export async function archivePersonalTask(
  task: PersonalTask
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const now = new Date();

  // 1. أدرج في archive
  const archiveRow = {
    id: `arc_pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'personal_task',
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
      category: task.category,
      dueDate: task.dueDate,
    },
  };

  const { error: archErr } = await supabase.from('archive').insert(archiveRow);
  if (archErr) return { error: archErr.message };

  // 2. احذف من personal_tasks
  const { error: delErr } = await supabase.from('personal_tasks').delete().eq('id', task.id);
  if (delErr) return { error: delErr.message };

  revalidatePath('/personal');
  revalidatePath('/archive');
  return {};
}

function mapRow(row: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  sort_order: number | null;
}): PersonalTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    category: (row.category ?? 'personal') as TaskCategory,
    dueDate: row.due_date ?? null,
    sortOrder: row.sort_order ?? 0,
    hasDescription: !!(row.description?.trim()),
  };
}
