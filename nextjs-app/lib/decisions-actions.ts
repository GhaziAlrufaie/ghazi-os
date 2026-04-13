'use server';
// Ghazi OS — Legendary Edition
// Server Actions للقرارات

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { Decision } from '@/app/decisions/page';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function addDecision(dec: Decision): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  const row = {
    id: dec.id,
    brand_id: dec.brand_id,
    project_id: dec.project_id,
    title: dec.title,
    context: dec.context,
    options: dec.options,
    chosen_option_id: dec.chosen_option_id,
    status: dec.status,
    impact: dec.impact,
    deadline: dec.deadline,
    decided_at: dec.decided_at,
    decided_by: dec.decided_by,
    notes: dec.notes,
  };
  const { error } = await supabase.from('decisions').insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/decisions');
  return { ok: true };
}

export async function decideNow(
  decId: string,
  optId: string
): Promise<{ ok: boolean; decision?: Decision; error?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('decisions')
    .update({
      chosen_option_id: optId,
      status: 'decided',
      decided_at: new Date().toISOString(),
    })
    .eq('id', decId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/decisions');
  return { ok: true, decision: data as Decision };
}

export async function revisitDecision(
  decId: string
): Promise<{ ok: boolean; decision?: Decision; error?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('decisions')
    .update({ status: 'pending', chosen_option_id: null, decided_at: null })
    .eq('id', decId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/decisions');
  return { ok: true, decision: data as Decision };
}

export async function saveDecision(
  decId: string,
  fields: { title: string; context: string; deadline: string; impact: string; notes: string }
): Promise<{ ok: boolean; decision?: Decision; error?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('decisions')
    .update({
      title: fields.title,
      context: fields.context,
      deadline: fields.deadline || null,
      impact: fields.impact,
      notes: fields.notes,
    })
    .eq('id', decId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/decisions');
  return { ok: true, decision: data as Decision };
}

export async function deleteDecision(decId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase.from('decisions').delete().eq('id', decId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/decisions');
  return { ok: true };
}

export async function archiveDecision(decId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  // جلب القرار أولاً
  const { data: dec, error: fetchErr } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decId)
    .single();
  if (fetchErr) return { ok: false, error: fetchErr.message };

  // إضافة للأرشيف
  const archiveRow = {
    id: genId(),
    type: 'decision',
    original_id: decId,
    brand_id: dec.brand_id,
    title: dec.title,
    reason: 'manual',
    archived_at: new Date().toISOString(),
    data: dec,
  };
  const { error: archErr } = await supabase.from('archive').insert(archiveRow);
  if (archErr) return { ok: false, error: archErr.message };

  // حذف من decisions
  const { error: delErr } = await supabase.from('decisions').delete().eq('id', decId);
  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath('/decisions');
  revalidatePath('/archive');
  return { ok: true };
}
