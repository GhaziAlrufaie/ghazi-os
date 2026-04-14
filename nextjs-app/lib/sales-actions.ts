'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getSallaOrders() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('salla_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addSallaOrder(input: {
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  brand: string;
  items: string; // JSON string
}) {
  const sb = getSupabase();
  let parsedItems = [];
  try {
    parsedItems = JSON.parse(input.items || '[]');
  } catch {
    parsedItems = [];
  }
  const sallaId = `MANUAL-${Date.now()}`;
  const { error } = await sb.from('salla_orders').insert({
    salla_order_id: sallaId,
    order_number: input.orderNumber || sallaId,
    status: input.status || 'pending',
    customer_name: input.customerName,
    customer_phone: input.customerPhone || '',
    customer_email: '',
    total_amount: input.totalAmount || 0,
    currency: 'SAR',
    items: parsedItems,
    raw_payload: {},
    brand: input.brand || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/sales');
}

export async function updateSallaOrder(id: number, input: {
  status: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  brand: string;
}) {
  const sb = getSupabase();
  const { error } = await sb.from('salla_orders').update({
    status: input.status,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    total_amount: input.totalAmount,
    brand: input.brand || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/sales');
}

export async function deleteSallaOrder(id: number) {
  const sb = getSupabase();
  const { error } = await sb.from('salla_orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/sales');
}
