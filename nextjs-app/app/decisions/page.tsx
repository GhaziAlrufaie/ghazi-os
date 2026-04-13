export const dynamic = 'force-dynamic';
// Ghazi OS — Legendary Edition
// قسم القرارات — Server Component يجلب البيانات من Supabase

import { createClient } from '@supabase/supabase-js';
import DecisionsClient from '@/components/decisions/DecisionsClient';

export interface DecisionOption {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
  estimatedCost: number | null;
  estimatedRevenue: number | null;
}

export interface Decision {
  id: string;
  brand_id: string | null;
  project_id: string | null;
  title: string;
  context: string;
  options: DecisionOption[];
  chosen_option_id: string | null;
  status: 'pending' | 'decided';
  impact: 'high' | 'medium' | 'low';
  deadline: string | null;
  decided_at: string | null;
  decided_by: string | null;
  notes: string;
}

export interface Brand {
  id: string;
  name: string;
  color: string;
  icon: string;
}

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [decisionsRes, brandsRes] = await Promise.all([
    supabase
      .from('decisions')
      .select('*')
      .order('impact', { ascending: true }),
    supabase
      .from('brands')
      .select('id, name, color, icon')
      .eq('status', 'active')
      .order('name'),
  ]);

  return {
    decisions: (decisionsRes.data ?? []) as Decision[],
    brands: (brandsRes.data ?? []) as Brand[],
  };
}

export default async function DecisionsPage() {
  const { decisions, brands } = await getData();

  const pending = decisions
    .filter((d) => d.status === 'pending')
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      const diff = (order[a.impact] ?? 1) - (order[b.impact] ?? 1);
      if (diff !== 0) return diff;
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });

  const decided = decisions.filter((d) => d.status === 'decided');

  return (
    <DecisionsClient
      initialPending={pending}
      initialDecided={decided}
      brands={brands}
    />
  );
}
