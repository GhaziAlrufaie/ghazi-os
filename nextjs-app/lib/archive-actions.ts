'use server';
// Ghazi OS — Legendary Edition
// Server Actions للأرشيف: استعادة، حذف، استرجاع براند

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** استعادة عنصر من الأرشيف وإعادته لجدوله الأصلي */
export async function restoreArchiveItem(archiveId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();

  // جلب العنصر من الأرشيف
  const { data: entry, error: fetchErr } = await supabase
    .from('archive')
    .select('*')
    .eq('id', archiveId)
    .single();

  if (fetchErr || !entry) {
    return { ok: false, error: 'العنصر غير موجود في الأرشيف' };
  }

  const { type, data } = entry as { type: string; data: Record<string, unknown> };

  // تحديد الجدول المستهدف
  const tableMap: Record<string, string> = {
    project: 'projects',
    task: 'tasks',
    subtask: 'tasks',
    decision: 'decisions',
  };

  const targetTable = tableMap[type];
  if (!targetTable) {
    return { ok: false, error: `نوع غير معروف: ${type}` };
  }

  // إعادة الإدخال للجدول الأصلي
  const { error: insertErr } = await supabase.from(targetTable).insert(data);
  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  // حذف من الأرشيف
  const { error: deleteErr } = await supabase.from('archive').delete().eq('id', archiveId);
  if (deleteErr) {
    return { ok: false, error: deleteErr.message };
  }

  revalidatePath('/archive');
  return { ok: true };
}

/** حذف نهائي من الأرشيف */
export async function deleteArchiveItem(archiveId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();

  const { error } = await supabase.from('archive').delete().eq('id', archiveId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/archive');
  return { ok: true };
}

/** استرجاع براند مؤرشف (تغيير status إلى active) */
export async function restoreArchivedBrand(brandId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('brands')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', brandId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/archive');
  return { ok: true };
}
