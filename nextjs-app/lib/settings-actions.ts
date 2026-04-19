'use server';
// Settings Server Actions — whatsapp_settings, team_contacts, daily_messages
import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WhatsappSettings {
  id: string;
  enabled: boolean;
  morning_reminder_enabled: boolean;
  morning_reminder_time: string;
  owner_phone: string;
  overdue_alert_enabled: boolean;
  decision_alert_enabled: boolean;
}

export interface TeamContact {
  id: string;
  name: string;
  phone: string;
  role?: string;
  active: boolean;
}

export interface DailyMessage {
  id: string;
  time: string;
  message: string;
  enabled: boolean;
}

// ─── WhatsApp Settings ────────────────────────────────────────────────────────
export async function getWhatsappSettings(): Promise<WhatsappSettings | null> {
  const sb = createServerClient();
  const { data } = await sb.from('whatsapp_settings').select('*').eq('id', 'main').single();
  return data as WhatsappSettings | null;
}

export async function updateWhatsappSettings(
  updates: Partial<Omit<WhatsappSettings, 'id'>>
): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb
    .from('whatsapp_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 'main');
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

// ─── Team Contacts ────────────────────────────────────────────────────────────
export async function getTeamContacts(): Promise<TeamContact[]> {
  const sb = createServerClient();
  const { data } = await sb.from('team_contacts').select('*').order('created_at');
  return (data ?? []) as TeamContact[];
}

export async function addTeamContact(input: { name: string; phone: string; role?: string }): Promise<void> {
  const sb = createServerClient();
  const id = `tc_${Date.now()}`;
  const { error } = await sb.from('team_contacts').insert({
    id,
    name: input.name,
    phone: input.phone,
    role: input.role ?? '',
    active: true,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteTeamContact(id: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from('team_contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

// ─── Daily Messages ────────────────────────────────────────────────────────────
export async function getDailyMessages(): Promise<DailyMessage[]> {
  const sb = createServerClient();
  const { data } = await sb.from('daily_messages').select('*').order('time');
  return (data ?? []) as DailyMessage[];
}

export async function addDailyMessage(input: { time: string; message: string }): Promise<void> {
  const sb = createServerClient();
  const id = `dm_${Date.now()}`;
  const { error } = await sb.from('daily_messages').insert({
    id,
    time: input.time,
    message: input.message,
    enabled: true,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function toggleDailyMessage(id: string, enabled: boolean): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from('daily_messages').update({ enabled }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteDailyMessage(id: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb.from('daily_messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}
