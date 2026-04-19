// Ghazi OS — Global Search API
// يبحث في: tasks, projects, decisions, brands
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = getSupabase();
  const pattern = `%${q}%`;

  // البحث المتوازي في 4 جداول
  const [tasksRes, projectsRes, decisionsRes, brandsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, status, brand_id')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('projects')
      .select('id, title, status, brand_id')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('decisions')
      .select('id, title, status, brand_id')
      .or(`title.ilike.${pattern},context.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('brands')
      .select('id, name, name_ar, color')
      .or(`name.ilike.${pattern},name_ar.ilike.${pattern}`)
      .limit(4),
  ]);

  // خريطة brand_id → brand name (نجمع كل brand_ids أولاً)
  const brandIds = new Set<string>();
  (tasksRes.data ?? []).forEach((r) => r.brand_id && brandIds.add(r.brand_id));
  (projectsRes.data ?? []).forEach((r) => r.brand_id && brandIds.add(r.brand_id));
  (decisionsRes.data ?? []).forEach((r) => r.brand_id && brandIds.add(r.brand_id));

  let brandMap: Record<string, string> = {};
  if (brandIds.size > 0) {
    const { data: bData } = await supabase
      .from('brands')
      .select('id, name_ar, name')
      .in('id', [...brandIds]);
    (bData ?? []).forEach((b) => {
      brandMap[b.id] = b.name_ar || b.name;
    });
  }

  const statusMap: Record<string, string> = {
    todo: 'قيد الانتظار', in_progress: 'جاري', on_hold: 'معلق', done: 'مكتمل',
    planning: 'تخطيط', active: 'نشط', completed: 'مكتمل', archived: 'مؤرشف',
    open: 'مفتوح', decided: 'تم القرار', pending: 'معلق',
  };

  type SearchResult = {
    type: 'task' | 'project' | 'decision' | 'brand';
    id: string;
    title: string;
    meta?: string;
    href: string;
    icon: string;
  };

  const results: SearchResult[] = [
    ...(tasksRes.data ?? []).map((r) => ({
      type: 'task' as const,
      id: r.id,
      title: r.title,
      meta: [brandMap[r.brand_id] ?? null, statusMap[r.status] ?? r.status].filter(Boolean).join(' · '),
      href: `/tasks`,
      icon: '📋',
    })),
    ...(projectsRes.data ?? []).map((r) => ({
      type: 'project' as const,
      id: r.id,
      title: r.title,
      meta: [brandMap[r.brand_id] ?? null, statusMap[r.status] ?? r.status].filter(Boolean).join(' · '),
      href: `/projects`,
      icon: '📁',
    })),
    ...(decisionsRes.data ?? []).map((r) => ({
      type: 'decision' as const,
      id: r.id,
      title: r.title,
      meta: [brandMap[r.brand_id] ?? null, statusMap[r.status] ?? r.status].filter(Boolean).join(' · '),
      href: `/decisions`,
      icon: '⚖️',
    })),
    ...(brandsRes.data ?? []).map((r) => ({
      type: 'brand' as const,
      id: r.id,
      title: r.name_ar || r.name,
      meta: undefined,
      href: `/brands/${r.id}`,
      icon: '🏷️',
    })),
  ];

  return NextResponse.json({ results });
}
