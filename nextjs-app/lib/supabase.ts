import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side client — يستخدم service_role key
 * استخدمه فقط في Server Actions و API Routes
 * لا يُرسَل أبداً للمتصفح
 */
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY غير موجود في .env.local');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Client-side client — يستخدم anon key
 * للقراءة العامة فقط (بعد تفعيل RLS)
 */
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Types مستخرجة من DATABASE_SCHEMA.md
export type Brand = {
  id: string;
  name: string;
  name_en: string;
  color: string;
  icon: string;
  status: 'active' | 'selling' | 'paused' | 'archived';
  health_score: number;
  created_at: string;
  description: string;
  production_days: number;
  nav_order: number;
  main_tab_label: string | null;
};

export type Task = {
  id: string;
  project_id: string | null;
  brand_id: string | null;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date: string | null;
  completed_at: string | null;
  tags: string[];
  notes: string;
  sort_order: number;
  checklist: { id: string; text: string; done: boolean }[];
  subtasks: unknown[];
  subtask_groups: unknown[];
  links: { id: string; url: string; title: string }[];
  attachments: { id: string; url: string; name: string; type: string }[];
  category: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  priority: 'critical' | 'high' | 'medium' | 'low';
  start_date: string | null;
  target_date: string | null;
  progress: number;
  tags: string[];
  sort_order: number;
};

export type Decision = {
  id: string;
  brand_id: string | null;
  project_id: string | null;
  title: string;
  context: string;
  options: { id: string; title: string; pros?: string; cons?: string }[];
  chosen_option_id: string | null;
  status: 'pending' | 'decided' | 'cancelled';
  impact: 'critical' | 'high' | 'medium' | 'low';
  deadline: string | null;
  decided_at: string | null;
  decided_by: string | null;
  notes: string;
};

export type SallaOrder = {
  id: number;
  salla_order_id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  items: { name: string; price: number; quantity: number; sku: string }[];
  brand: string;
  created_at: string;
  updated_at: string;
};

export type WeeklyFocus = {
  focus_date: string;
  target_type: 'brand' | 'project';
  target_id: string;
  target_name: string;
  target_color: string;
  notes: string;
  metrics_cache: { today_sales?: number };
};
