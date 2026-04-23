'use server';
// Server Actions — Inbox (inbox_tasks table)
// صندوق الأفكار السريعة — إضافة + تعديل + حذف

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface InboxTask {
  id: string;
  text: string;
  created_at: string;
}

export async function getInboxTasks(): Promise<InboxTask[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('inbox_tasks')
    .select('id, text, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getInboxTasks error:', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    text: row.text ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
  }));
}

export async function addInboxTask(
  text: string
): Promise<{ task?: InboxTask; error?: string }> {
  const supabase = createServerClient();
  const id = `inbox_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from('inbox_tasks')
    .insert({ id, text: text.trim() })
    .select('id, text, created_at')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/inbox');
  revalidatePath('/leadership');
  return {
    task: {
      id: data.id,
      text: data.text,
      created_at: data.created_at,
    },
  };
}

export async function updateInboxTask(
  id: string,
  text: string
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('inbox_tasks')
    .update({ text: text.trim() })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/inbox');
  revalidatePath('/leadership');
  return {};
}

export async function deleteInboxTask(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('inbox_tasks')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/inbox');
  revalidatePath('/leadership');
  return {};
}
