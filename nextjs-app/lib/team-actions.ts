'use server';

import { createClient } from '@supabase/supabase-js';
import type { Employee } from './team-types';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getEmployees(): Promise<Employee[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export async function addEmployee(input: {
  name: string;
  role: string;
  brandIds: string[];
  salaryType: 'fixed' | 'per_unit' | 'freelance';
  salaryAmount: number;
  salaryUnit?: string;
  reportsTo?: string;
  status: 'active' | 'inactive' | 'freelance';
}): Promise<Employee> {
  const sb = getSupabase();
  const id = `emp${Date.now()}`;
  const { data, error } = await sb
    .from('employees')
    .insert({
      id,
      name: input.name,
      role: input.role,
      brand_ids: input.brandIds,
      salary_type: input.salaryType,
      salary_amount: input.salaryAmount,
      salary_unit: input.salaryUnit ?? null,
      reports_to: input.reportsTo ?? null,
      status: input.status,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Employee;
}

export async function updateEmployee(
  id: string,
  updates: {
    name?: string;
    role?: string;
    brandIds?: string[];
    salaryType?: 'fixed' | 'per_unit' | 'freelance';
    salaryAmount?: number;
    salaryUnit?: string | null;
    reportsTo?: string | null;
    status?: 'active' | 'inactive' | 'freelance';
    sopUrl?: string | null;
    accessRights?: string | null;
    privateNotes?: string | null;
    kudos?: number;
    warnings?: number;
    phone?: string | null;
    iban?: string | null;
    brand?: string | null;
    attachments?: { name: string; url: string }[] | null;
  }
): Promise<void> {
  const sb = getSupabase();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.brandIds !== undefined) payload.brand_ids = updates.brandIds;
  if (updates.salaryType !== undefined) payload.salary_type = updates.salaryType;
  if (updates.salaryAmount !== undefined) payload.salary_amount = updates.salaryAmount;
  if (updates.salaryUnit !== undefined) payload.salary_unit = updates.salaryUnit;
  if (updates.reportsTo !== undefined) payload.reports_to = updates.reportsTo;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.sopUrl !== undefined) payload.sop_url = updates.sopUrl;
  if (updates.accessRights !== undefined) payload.access_rights = updates.accessRights;
  if (updates.privateNotes !== undefined) payload.private_notes = updates.privateNotes;
  if (updates.kudos !== undefined) payload.kudos = updates.kudos;
  if (updates.warnings !== undefined) payload.warnings = updates.warnings;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.iban !== undefined) payload.iban = updates.iban;
  if (updates.brand !== undefined) payload.brand = updates.brand;
  if (updates.attachments !== undefined) payload.attachments = updates.attachments;
  const { error } = await sb.from('employees').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEmployee(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
