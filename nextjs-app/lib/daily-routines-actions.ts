'use server';
// Server Actions — Daily Routines (daily_routines table)

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface DailyRoutine {
  id: string;
  title: string;
  meta: string;
  timeStr: string;
  isDone: boolean;
  sortOrder: number;
  type: 'daily' | 'weekly';
}

export async function getDailyRoutines(): Promise<DailyRoutine[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('daily_routines')
    .select('id, title, meta, time_str, is_done, sort_order, type')
    .order('sort_order');
  return (data ?? []).map(r => ({
    id: r.id as string,
    title: r.title as string,
    meta: (r.meta as string) ?? '',
    timeStr: (r.time_str as string) ?? '',
    isDone: (r.is_done as boolean) ?? false,
    sortOrder: (r.sort_order as number) ?? 0,
    type: ((r.type as string) === 'weekly' ? 'weekly' : 'daily') as 'daily' | 'weekly',
  }));
}

export async function addDailyRoutine(input: {
  title: string;
  meta: string;
  timeStr: string;
  type?: 'daily' | 'weekly';
}): Promise<{ routine?: DailyRoutine; error?: string }> {
  const supabase = createServerClient();
  const routineType = input.type ?? 'daily';

  // Get max sort_order for this type
  const { data: existing } = await supabase
    .from('daily_routines')
    .select('sort_order')
    .eq('type', routineType)
    .order('sort_order', { ascending: false })
    .limit(1);
  const maxOrder = existing?.[0]?.sort_order ?? 0;

  const { data, error } = await supabase
    .from('daily_routines')
    .insert({
      title: input.title,
      meta: input.meta,
      time_str: input.timeStr,
      is_done: false,
      sort_order: maxOrder + 1,
      type: routineType,
    })
    .select('id, title, meta, time_str, is_done, sort_order, type')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/leadership');
  return {
    routine: {
      id: data.id,
      title: data.title,
      meta: data.meta ?? '',
      timeStr: data.time_str ?? '',
      isDone: data.is_done ?? false,
      sortOrder: data.sort_order ?? 0,
      type: ((data.type as string) === 'weekly' ? 'weekly' : 'daily') as 'daily' | 'weekly',
    },
  };
}

export async function resetRoutinesByType(
  type: 'daily' | 'weekly'
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('daily_routines')
    .update({ is_done: false })
    .eq('type', type);
  if (error) return { error: error.message };
  revalidatePath('/leadership');
  return {};
}

export async function toggleDailyRoutine(
  id: string,
  isDone: boolean
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('daily_routines')
    .update({ is_done: isDone })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/leadership');
  return {};
}

export async function updateDailyRoutineTime(
  id: string,
  timeStr: string
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('daily_routines')
    .update({ time_str: timeStr })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/leadership');
  return {};
}

export async function deleteDailyRoutine(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('daily_routines')
    .delete()
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/leadership');
  return {};
}
