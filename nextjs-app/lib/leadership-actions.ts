'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Decisions ───────────────────────────────────────────────────────────────

export async function getDecisions() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('decisions')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addDecision(input: {
  title: string;
  brandId: string;
  impact: string;
  status: string;
  context: string;
  deadline: string;
  notes: string;
}) {
  const sb = getSupabase();
  const id = `d${Date.now()}`;
  const { error } = await sb.from('decisions').insert({
    id,
    title: input.title,
    brand_id: input.brandId || null,
    impact: input.impact || 'medium',
    status: input.status || 'open',
    context: input.context || null,
    options: [],
    chosen_option_id: null,
    deadline: input.deadline || null,
    notes: input.notes || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/leadership');
}

export async function updateDecision(id: string, input: {
  title: string;
  brandId: string;
  impact: string;
  status: string;
  context: string;
  deadline: string;
  notes: string;
}) {
  const sb = getSupabase();
  const { error } = await sb.from('decisions').update({
    title: input.title,
    brand_id: input.brandId || null,
    impact: input.impact,
    status: input.status,
    context: input.context || null,
    deadline: input.deadline || null,
    notes: input.notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/leadership');
}

export async function deleteDecision(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from('decisions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/leadership');
}

// ─── Employees ───────────────────────────────────────────────────────────────

export async function getEmployees() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('employees')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addEmployee(input: {
  name: string;
  role: string;
  brandIds: string[];
  salaryType: string;
  salaryAmount: number;
  salaryUnit: string;
  status: string;
}) {
  const sb = getSupabase();
  const id = `emp${Date.now()}`;
  const { error } = await sb.from('employees').insert({
    id,
    name: input.name,
    role: input.role,
    brand_ids: input.brandIds,
    salary_type: input.salaryType || 'fixed',
    salary_amount: input.salaryAmount || 0,
    salary_unit: input.salaryUnit || null,
    status: input.status || 'active',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/leadership');
}

export async function updateEmployee(id: string, input: {
  name: string;
  role: string;
  brandIds: string[];
  salaryType: string;
  salaryAmount: number;
  salaryUnit: string;
  status: string;
}) {
  const sb = getSupabase();
  const { error } = await sb.from('employees').update({
    name: input.name,
    role: input.role,
    brand_ids: input.brandIds,
    salary_type: input.salaryType,
    salary_amount: input.salaryAmount,
    salary_unit: input.salaryUnit || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/leadership');
}

export async function deleteEmployee(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/leadership');
}
