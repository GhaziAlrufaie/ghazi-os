'use server';
// Server Actions — Inbox (daily_messages table)
// الوارد: رسائل يومية من العملاء/الفرق — إضافة + أرشفة + حذف

import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type MessageSource = 'whatsapp' | 'email' | 'instagram' | 'other';
export type MessageStatus = 'unread' | 'read' | 'archived';

export interface InboxMessage {
  id: string;
  content: string;
  sender: string;
  source: MessageSource;
  status: MessageStatus;
  brandId: string | null;
  createdAt: string;
}

interface AddMessageInput {
  content: string;
  sender: string;
  source: MessageSource;
  brandId?: string | null;
}

function genId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function addMessage(
  input: AddMessageInput
): Promise<{ message?: InboxMessage; error?: string }> {
  const supabase = createServerClient();
  const id = genId();

  const { data, error } = await supabase
    .from('daily_messages')
    .insert({
      id,
      content: input.content,
      sender: input.sender,
      source: input.source,
      status: 'unread',
      brand_id: input.brandId ?? null,
    })
    .select('id,content,sender,source,status,brand_id,created_at')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/inbox');

  return { message: mapRow(data) };
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('daily_messages')
    .update({ status })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/inbox');
  return {};
}

export async function deleteMessage(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('daily_messages').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/inbox');
  return {};
}

function mapRow(row: {
  id: string;
  content: string | null;
  sender: string | null;
  source: string | null;
  status: string | null;
  brand_id: string | null;
  created_at: string | null;
}): InboxMessage {
  return {
    id: row.id,
    content: row.content ?? '',
    sender: row.sender ?? '',
    source: (row.source ?? 'other') as MessageSource,
    status: (row.status ?? 'unread') as MessageStatus,
    brandId: row.brand_id ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}
