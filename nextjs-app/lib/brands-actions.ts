'use server';
// Server Actions — Brands (brands table)
import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface BrandRow {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  icon: string;
  status: 'active' | 'paused' | 'archived';
  healthScore: number;
  description: string;
  productionDays: number;
  navOrder: number;
  mainTabLabel: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  paused: 'متوقف',
  archived: 'مؤرشف',
};

function mapRow(r: Record<string, unknown>): BrandRow {
  return {
    id: r.id as string,
    name: r.name as string,
    nameEn: (r.name_en as string) ?? '',
    color: (r.color as string) ?? '#C9963B',
    icon: (r.icon as string) ?? '🏷',
    status: (r.status as BrandRow['status']) ?? 'active',
    healthScore: (r.health_score as number) ?? 0,
    description: (r.description as string) ?? '',
    productionDays: (r.production_days as number) ?? 7,
    navOrder: (r.nav_order as number) ?? 99,
    mainTabLabel: (r.main_tab_label as string | null) ?? null,
  };
}

export async function getBrands(): Promise<BrandRow[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('brands')
    .select('*')
    .order('nav_order');
  return (data ?? []).map(mapRow);
}

interface AddInput {
  name: string;
  nameEn: string;
  color: string;
  icon: string;
  status: string;
  description: string;
  productionDays: number;
}

export async function addBrand(
  input: AddInput
): Promise<{ brand?: BrandRow; error?: string }> {
  const supabase = createServerClient();
  const id = `b${Date.now()}`;
  const { data: maxRow } = await supabase.from('brands').select('nav_order').order('nav_order', { ascending: false }).limit(1).single();
  const navOrder = ((maxRow?.nav_order as number) ?? 0) + 1;
  const { data, error } = await supabase
    .from('brands')
    .insert({
      id,
      name: input.name,
      name_en: input.nameEn,
      color: input.color,
      icon: input.icon,
      status: input.status,
      description: input.description,
      production_days: input.productionDays,
      nav_order: navOrder,
      health_score: 0,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/brands');
  return { brand: mapRow(data) };
}

export async function updateBrand(
  input: AddInput & { id: string }
): Promise<{ brand?: BrandRow; error?: string }> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('brands')
    .update({
      name: input.name,
      name_en: input.nameEn,
      color: input.color,
      icon: input.icon,
      status: input.status,
      description: input.description,
      production_days: input.productionDays,
    })
    .eq('id', input.id)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/brands');
  return { brand: mapRow(data) };
}

export async function deleteBrand(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/brands');
  return {};
}

export { STATUS_LABELS };
