'use server';
// Server Actions — Events (events table)
import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { EventRow } from '@/lib/events-types';

function genId(): string {
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function getEvents(): Promise<EventRow[]> {
  const supabase = createServerClient();
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('year').order('month').order('day');
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, color');
  const brandsMap: Record<string, { name: string; color: string }> = {};
  (brands ?? []).forEach((b) => { brandsMap[b.id] = { name: b.name, color: b.color }; });
  return (events ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    day: r.day,
    month: r.month,
    year: r.year,
    brandId: r.brand_id ?? null,
    brandName: r.brand_id ? (brandsMap[r.brand_id]?.name ?? null) : null,
    brandColor: r.brand_id ? (brandsMap[r.brand_id]?.color ?? null) : null,
    type: r.type ?? 'event',
  }));
}

interface AddInput {
  title: string;
  day: number;
  month: number;
  year: number;
  brandId: string | null;
  type: string;
}

export async function addEventRow(
  input: AddInput
): Promise<{ event?: EventRow; error?: string }> {
  const supabase = createServerClient();
  const id = genId();
  const { data, error } = await supabase
    .from('events')
    .insert({ id, title: input.title, day: input.day, month: input.month, year: input.year, brand_id: input.brandId, type: input.type })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/events');
  revalidatePath('/calendar');
  const { data: brands } = await supabase.from('brands').select('id, name, color');
  const brandsMap: Record<string, { name: string; color: string }> = {};
  (brands ?? []).forEach((b) => { brandsMap[b.id] = { name: b.name, color: b.color }; });
  return {
    event: {
      id: data.id,
      title: data.title,
      day: data.day,
      month: data.month,
      year: data.year,
      brandId: data.brand_id ?? null,
      brandName: data.brand_id ? (brandsMap[data.brand_id]?.name ?? null) : null,
      brandColor: data.brand_id ? (brandsMap[data.brand_id]?.color ?? null) : null,
      type: data.type ?? 'event',
    },
  };
}

export async function updateEventRow(
  input: AddInput & { id: string }
): Promise<{ event?: EventRow; error?: string }> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .update({ title: input.title, day: input.day, month: input.month, year: input.year, brand_id: input.brandId, type: input.type })
    .eq('id', input.id)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/events');
  revalidatePath('/calendar');
  const { data: brands } = await supabase.from('brands').select('id, name, color');
  const brandsMap: Record<string, { name: string; color: string }> = {};
  (brands ?? []).forEach((b) => { brandsMap[b.id] = { name: b.name, color: b.color }; });
  return {
    event: {
      id: data.id,
      title: data.title,
      day: data.day,
      month: data.month,
      year: data.year,
      brandId: data.brand_id ?? null,
      brandName: data.brand_id ? (brandsMap[data.brand_id]?.name ?? null) : null,
      brandColor: data.brand_id ? (brandsMap[data.brand_id]?.color ?? null) : null,
      type: data.type ?? 'event',
    },
  };
}

export async function deleteEventRow(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/events');
  revalidatePath('/calendar');
  return {};
}
