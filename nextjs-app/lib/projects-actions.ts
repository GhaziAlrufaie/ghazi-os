'use server';
// Server Actions — Projects (projects table)
import { createServerClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { ProjectRow } from '@/lib/projects-types';

function mapRow(r: Record<string, unknown>): ProjectRow {
  return {
    id: r.id as string,
    brandId: (r.brand_id as string | null) ?? null,
    title: r.title as string,
    description: (r.description as string) ?? '',
    status: (r.status as ProjectRow['status']) ?? 'planning',
    priority: (r.priority as ProjectRow['priority']) ?? 'medium',
    startDate: (r.start_date as string | null) ?? null,
    targetDate: (r.target_date as string | null) ?? null,
    progress: (r.progress as number) ?? 0,
    tags: (r.tags as string[]) ?? [],
    sortOrder: (r.sort_order as number) ?? 0,
    updatedAt: (r.updated_at as string | null) ?? null,
  };
}

export async function getProjects(): Promise<ProjectRow[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order');
  return (data ?? []).map(mapRow);
}

interface AddInput {
  brandId: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate: string | null;
  targetDate: string | null;
  tags: string[];
}

export async function addProject(
  input: AddInput
): Promise<{ project?: ProjectRow; error?: string }> {
  const supabase = createServerClient();
  const id = `p${Date.now()}`;
  const { data: maxRow } = await supabase
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();
  const sortOrder = ((maxRow?.sort_order as number) ?? 0) + 1;
  const { data, error } = await supabase
    .from('projects')
    .insert({
      id,
      brand_id: input.brandId || null,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      start_date: input.startDate || null,
      target_date: input.targetDate || null,
      tags: input.tags,
      progress: 0,
      sort_order: sortOrder,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/projects');
  return { project: mapRow(data) };
}

export async function updateProject(
  input: AddInput & { id: string; progress: number }
): Promise<{ project?: ProjectRow; error?: string }> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('projects')
    .update({
      brand_id: input.brandId || null,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      start_date: input.startDate || null,
      target_date: input.targetDate || null,
      tags: input.tags,
      progress: input.progress,
    })
    .eq('id', input.id)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/projects');
  return { project: mapRow(data) };
}


export async function updateProjectStatus(
  id: string,
  status: ProjectRow['status']
): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('projects').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/projects');
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/projects');
  return {};
}
