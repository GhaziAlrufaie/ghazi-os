'use server';
// Server Actions — Reminders (reminders table)
import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface Reminder {
  id: string;
  text: string;
  created_at: string;
}

export async function getReminders(): Promise<Reminder[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('reminders')
    .select('id, text, created_at')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Reminder[];
}

export async function addReminder(text: string): Promise<{ reminder?: Reminder; error?: string }> {
  const supabase = createServerClient();
  const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from('reminders')
    .insert({ id, text, created_at: new Date().toISOString() })
    .select('id, text, created_at')
    .single();
  if (error) return { error: error.message };
  revalidatePath('/reminders');
  return { reminder: data as Reminder };
}

export async function updateReminder(id: string, text: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('reminders').update({ text }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/reminders');
  return {};
}

export async function deleteReminder(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/reminders');
  return {};
}

export async function restoreReminder(reminder: Reminder): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('reminders').insert({
    id: reminder.id,
    text: reminder.text,
    created_at: reminder.created_at,
  });
  if (error) return { error: error.message };
  revalidatePath('/reminders');
  return {};
}
