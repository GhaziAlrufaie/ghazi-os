'use server';
// Server Actions — Calendar (events table)

import { createClient } from '@/lib/supabase';
import type { CalEvent } from '@/app/calendar/page';
import { revalidatePath } from 'next/cache';

function genId(): string {
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface AddEventInput {
  title: string;
  day: number;
  month: number;
  year: number;
  brandId: string | null;
  type: string;
}

export async function addEvent(
  input: AddEventInput
): Promise<{ event?: CalEvent; error?: string }> {
  const supabase = createClient();
  const id = genId();

  const row = {
    id,
    title: input.title,
    day: input.day,
    month: input.month,
    year: input.year,
    brand_id: input.brandId,
    type: input.type,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/calendar');

  const event: CalEvent = {
    id: data.id,
    title: data.title,
    day: data.day,
    month: data.month,
    year: data.year,
    brandId: data.brand_id ?? null,
    type: data.type ?? 'event',
  };

  return { event };
}

export async function deleteEvent(id: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/calendar');
  return {};
}
