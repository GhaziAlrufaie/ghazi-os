'use server';
// Server Actions — Weekly Focus (weekly_focus table)
// الفوكس الأسبوعي: تعيين براند أو هدف لكل يوم في الأسبوع

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type FocusTargetType = 'brand' | 'personal' | 'custom';

export interface WeeklyFocusEntry {
  id: string;
  focusDate: string; // YYYY-MM-DD
  targetType: FocusTargetType;
  targetId: string | null;
  targetName: string;
  targetColor: string;
  notes: string;
}

interface SetFocusInput {
  focusDate: string;
  targetType: FocusTargetType;
  targetId?: string | null;
  targetName: string;
  targetColor: string;
  notes?: string;
}

export async function setDayFocus(
  input: SetFocusInput
): Promise<{ entry?: WeeklyFocusEntry; error?: string }> {
  const supabase = createServerClient();

  // Check if entry exists for this date
  const { data: existing } = await supabase
    .from('weekly_focus')
    .select('id')
    .eq('focus_date', input.focusDate)
    .maybeSingle();

  let data;
  let error;

  if (existing?.id) {
    // Update
    const result = await supabase
      .from('weekly_focus')
      .update({
        target_type: input.targetType,
        target_id: input.targetId ?? null,
        target_name: input.targetName,
        target_color: input.targetColor,
        notes: input.notes ?? '',
      })
      .eq('id', existing.id)
      .select('id,focus_date,target_type,target_id,target_name,target_color,notes')
      .single();
    data = result.data;
    error = result.error;
  } else {
    // Insert
    const result = await supabase
      .from('weekly_focus')
      .insert({
        focus_date: input.focusDate,
        target_type: input.targetType,
        target_id: input.targetId ?? null,
        target_name: input.targetName,
        target_color: input.targetColor,
        notes: input.notes ?? '',
        metrics_cache: {},
      })
      .select('id,focus_date,target_type,target_id,target_name,target_color,notes')
      .single();
    data = result.data;
    error = result.error;
  }

  if (error || !data) return { error: error?.message ?? 'no data' };
  revalidatePath('/weekly-focus');
  revalidatePath('/leadership');

  return { entry: mapRow(data) };
}

export async function clearDayFocus(date: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('weekly_focus')
    .delete()
    .eq('focus_date', date);
  if (error) return { error: error.message };
  revalidatePath('/weekly-focus');
  revalidatePath('/leadership');
  return {};
}

export async function moveFocusToNextDay(date: string): Promise<{ error?: string }> {
  const supabase = createServerClient();

  // Get current entry
  const { data: entry, error: fetchError } = await supabase
    .from('weekly_focus')
    .select('*')
    .eq('focus_date', date)
    .maybeSingle();

  if (fetchError || !entry) return { error: 'لم يتم العثور على الفوكس لهذا اليوم' };

  // Calculate next business day (skip Friday/Saturday → Sunday)
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  const day = d.getDay(); // 0=Sun, 5=Fri, 6=Sat
  if (day === 5) d.setDate(d.getDate() + 2); // Fri → Sun
  if (day === 6) d.setDate(d.getDate() + 1); // Sat → Sun

  const nextDate = d.toISOString().split('T')[0];

  // Set focus for next day
  const result = await setDayFocus({
    focusDate: nextDate,
    targetType: entry.target_type as FocusTargetType,
    targetId: entry.target_id,
    targetName: entry.target_name ?? '',
    targetColor: entry.target_color ?? '#C9A84C',
    notes: entry.notes ?? '',
  });

  if (result.error) return { error: result.error };

  // Clear current day
  await clearDayFocus(date);
  return {};
}

function mapRow(row: {
  id: string;
  focus_date: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  target_color: string | null;
  notes: string | null;
}): WeeklyFocusEntry {
  return {
    id: row.id,
    focusDate: row.focus_date,
    targetType: (row.target_type ?? 'brand') as FocusTargetType,
    targetId: row.target_id ?? null,
    targetName: row.target_name ?? '',
    targetColor: row.target_color ?? '#C9A84C',
    notes: row.notes ?? '',
  };
}
