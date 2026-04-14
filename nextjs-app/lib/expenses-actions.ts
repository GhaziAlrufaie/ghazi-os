'use server';

import { createClient } from '@supabase/supabase-js';
import type { ExpenseSection, ExpenseItem } from './expenses-types';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getExpenseSections(): Promise<ExpenseSection[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('expenses')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ExpenseSection[];
}

export async function addExpenseItem(
  sectionId: string,
  currentItems: ExpenseItem[],
  newItem: Omit<ExpenseItem, 'id'>
): Promise<ExpenseSection> {
  const sb = getSupabase();
  const item: ExpenseItem = {
    ...newItem,
    id: `exp-item-${Date.now()}`,
  };
  const updatedItems = [...currentItems, item];
  const { data, error } = await sb
    .from('expenses')
    .update({ items: updatedItems, updated_at: new Date().toISOString() })
    .eq('id', sectionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExpenseSection;
}

export async function updateExpenseItem(
  sectionId: string,
  currentItems: ExpenseItem[],
  itemId: string,
  updates: Partial<ExpenseItem>
): Promise<ExpenseSection> {
  const sb = getSupabase();
  const updatedItems = currentItems.map(item =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  const { data, error } = await sb
    .from('expenses')
    .update({ items: updatedItems, updated_at: new Date().toISOString() })
    .eq('id', sectionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExpenseSection;
}

export async function deleteExpenseItem(
  sectionId: string,
  currentItems: ExpenseItem[],
  itemId: string
): Promise<ExpenseSection> {
  const sb = getSupabase();
  const updatedItems = currentItems.filter(item => item.id !== itemId);
  const { data, error } = await sb
    .from('expenses')
    .update({ items: updatedItems, updated_at: new Date().toISOString() })
    .eq('id', sectionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ExpenseSection;
}
