'use server';

import { createClient } from '@supabase/supabase-js';
import type { ExpenseSection, MonthlyGoal } from './accounts-types';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function getExpenses(): Promise<ExpenseSection[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ExpenseSection[];
}

export async function updateExpenseSection(
  id: string,
  updates: Partial<Pick<ExpenseSection, 'title' | 'items'>>
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from('expenses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function addExpenseSection(input: {
  title: string;
  type: string;
  color: string;
}): Promise<ExpenseSection> {
  const sb = getSupabase();
  const id = `exp-sec-${Date.now()}`;
  const { data, error } = await sb
    .from('expenses')
    .insert({
      id,
      title: input.title,
      type: input.type,
      color: input.color,
      items: [],
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExpenseSection;
}

export async function deleteExpenseSection(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Monthly Goals ───────────────────────────────────────────────────────────

export async function getMonthlyGoals(): Promise<MonthlyGoal[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('jawza_monthly_goals')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MonthlyGoal[];
}

export async function addMonthlyGoal(input: {
  year: number;
  month: number;
  revenueTarget: number;
  ordersTarget: number;
  newCustomersTarget: number;
  notes?: string;
}): Promise<MonthlyGoal> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('jawza_monthly_goals')
    .insert({
      year: input.year,
      month: input.month,
      revenue_target: input.revenueTarget,
      orders_target: input.ordersTarget,
      new_customers_target: input.newCustomersTarget,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MonthlyGoal;
}

export async function updateMonthlyGoal(
  id: string,
  updates: {
    revenueTarget?: number;
    ordersTarget?: number;
    newCustomersTarget?: number;
    notes?: string;
  }
): Promise<void> {
  const sb = getSupabase();
  const payload: Record<string, unknown> = {};
  if (updates.revenueTarget !== undefined) payload.revenue_target = updates.revenueTarget;
  if (updates.ordersTarget !== undefined) payload.orders_target = updates.ordersTarget;
  if (updates.newCustomersTarget !== undefined) payload.new_customers_target = updates.newCustomersTarget;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  const { error } = await sb.from('jawza_monthly_goals').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteMonthlyGoal(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from('jawza_monthly_goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
