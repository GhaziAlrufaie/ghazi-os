'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Metrics ──────────────────────────────────────────────────────────────

export async function getMetrics() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('metrics')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addMetric(input: {
  brandId: string;
  date: string;
  revenue: number;
  orders: number;
  adSpend: number;
}) {
  const sb = getSupabase();
  const id = `m${Date.now()}`;
  const avgOrderValue = input.orders > 0 ? Math.round(input.revenue / input.orders) : 0;
  const roas = input.adSpend > 0 ? Math.round((input.revenue / input.adSpend) * 10) / 10 : 0;
  const { error } = await sb.from('metrics').insert({
    id,
    brand_id: input.brandId,
    date: input.date,
    revenue: input.revenue,
    orders: input.orders,
    avg_order_value: avgOrderValue,
    ad_spend: input.adSpend,
    roas,
    custom_metrics: {},
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function updateMetric(id: string, input: {
  brandId: string;
  date: string;
  revenue: number;
  orders: number;
  adSpend: number;
}) {
  const sb = getSupabase();
  const avgOrderValue = input.orders > 0 ? Math.round(input.revenue / input.orders) : 0;
  const roas = input.adSpend > 0 ? Math.round((input.revenue / input.adSpend) * 10) / 10 : 0;
  const { error } = await sb.from('metrics').update({
    brand_id: input.brandId,
    date: input.date,
    revenue: input.revenue,
    orders: input.orders,
    avg_order_value: avgOrderValue,
    ad_spend: input.adSpend,
    roas,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function deleteMetric(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from('metrics').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

// ─── Monthly Goals ────────────────────────────────────────────────────────

export async function getMonthlyGoals() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('jawza_monthly_goals')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addMonthlyGoal(input: {
  year: number;
  month: number;
  revenueTarget: number;
  ordersTarget: number;
  newCustomersTarget: number;
  notes: string;
}) {
  const sb = getSupabase();
  const { error } = await sb.from('jawza_monthly_goals').insert({
    year: input.year,
    month: input.month,
    revenue_target: input.revenueTarget,
    orders_target: input.ordersTarget,
    new_customers_target: input.newCustomersTarget,
    notes: input.notes || null,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function updateMonthlyGoal(id: string, input: {
  revenueTarget: number;
  ordersTarget: number;
  newCustomersTarget: number;
  notes: string;
}) {
  const sb = getSupabase();
  const { error } = await sb.from('jawza_monthly_goals').update({
    revenue_target: input.revenueTarget,
    orders_target: input.ordersTarget,
    new_customers_target: input.newCustomersTarget,
    notes: input.notes || null,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function deleteMonthlyGoal(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from('jawza_monthly_goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

// ─── Campaigns ────────────────────────────────────────────────────────────

export async function getCampaigns() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('campaigns')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addCampaign(input: {
  brandId: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  channels: string;
  notes: string;
}) {
  const sb = getSupabase();
  const id = `c${Date.now()}`;
  const channelsArr = input.channels ? input.channels.split(',').map(c => c.trim()).filter(Boolean) : [];
  const { error } = await sb.from('campaigns').insert({
    id,
    brand_id: input.brandId,
    title: input.title,
    type: input.type || 'general',
    status: input.status || 'planned',
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    budget: input.budget || 0,
    actual_spend: 0,
    channels: channelsArr,
    target_metrics: {},
    actual_metrics: {},
    tasks: [],
    notes: input.notes || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function updateCampaign(id: string, input: {
  brandId: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: number;
  actualSpend: number;
  channels: string;
  notes: string;
}) {
  const sb = getSupabase();
  const channelsArr = input.channels ? input.channels.split(',').map(c => c.trim()).filter(Boolean) : [];
  const { error } = await sb.from('campaigns').update({
    brand_id: input.brandId,
    title: input.title,
    type: input.type,
    status: input.status,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    budget: input.budget,
    actual_spend: input.actualSpend,
    channels: channelsArr,
    notes: input.notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function deleteCampaign(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from('campaigns').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}
