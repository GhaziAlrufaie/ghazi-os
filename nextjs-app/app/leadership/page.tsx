/*
 * Ghazi OS — Leadership Page (المركز القيادي)
 * المرحلة 2 — WeeklyCompass + FocusHero + StickyBanner + Decisions + Calendar + Inbox
 * Server Component — يجلب كل البيانات من Supabase
 */
export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import LeadershipClient from '@/components/leadership/LeadershipClient';
import type { WeeklyFocusEntry, FocusTargetType } from '@/lib/weekly-focus-actions';
import type { InboxTask } from '@/lib/inbox-actions';
import type { DecisionRow, EmployeeRow } from '@/lib/leadership-types';
import type { DailyRoutine } from '@/lib/daily-routines-actions';

// ── Helper: today + 6 days ──
function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default async function LeadershipPage() {
  const supabase = createServerClient();
  const weekDates = getWeekDates();
  const todayStr = weekDates[0];

  // ── جلب كل البيانات بالتوازي ──
  const [
    brandsRes,
    weeklyFocusRes,
    tasksRes,
    projectsRes,
    personalTasksRes,
    decisionsRes,
    employeesRes,
    inboxRes,
    eventsRes,
    salesRes,
    dailyRoutinesRes,
  ] = await Promise.allSettled([
    supabase.from('brands').select('id, name, icon, color, status, nav_order').order('nav_order'),
    supabase.from('weekly_focus').select('id, focus_date, target_type, target_id, target_name, target_color, notes, metrics_cache').in('focus_date', weekDates),
    supabase.from('tasks').select('id, title, status, priority, due_date, brand_id, project_id, subtasks, subtask_groups, checklist, description').not('status', 'in', '("done","cancelled")').order('sort_order'),
    supabase.from('projects').select('id, brand_id, title, status, priority, target_date, progress').eq('status', 'active').order('sort_order'),
    supabase.from('personal_tasks').select('id, title, status, priority, category').not('status', 'in', '("done","cancelled")').order('sort_order'),
    supabase.from('decisions').select('id, brand_id, project_id, title, context, options, chosen_option_id, status, impact, deadline, decided_at, decided_by, notes, updated_at').eq('status', 'open').order('updated_at', { ascending: false }),
    supabase.from('employees').select('id, name, role, brand_ids, salary_type, salary_amount, salary_unit, reports_to, status, created_at, updated_at').order('created_at'),
    supabase.from('inbox_tasks').select('id, text, created_at').order('created_at', { ascending: false }),
    supabase.from('events').select('id, title, day, month, year, brand_id').gte('day', new Date().getDate()).eq('month', new Date().getMonth() + 1).eq('year', new Date().getFullYear()).order('day'),
    supabase.from('salla_orders').select('total_amount').gte('created_at', `${todayStr}T00:00:00`).lte('created_at', `${todayStr}T23:59:59`),
    supabase.from('daily_routines').select('id, title, meta, time_str, is_done, sort_order').order('sort_order'),
  ]);

  // ── معالجة البيانات ──
  const rawBrands = brandsRes.status === 'fulfilled' && !brandsRes.value.error ? (brandsRes.value.data ?? []) : [];
  const brands = rawBrands.map((b: Record<string, unknown>) => ({
    id: b.id as string,
    name: b.name as string,
    icon: (b.icon as string) ?? '✨',
    color: (b.color as string) ?? '#C9A84C',
    status: (b.status as string) ?? 'active',
  }));

  const rawFocus = weeklyFocusRes.status === 'fulfilled' && !weeklyFocusRes.value.error ? (weeklyFocusRes.value.data ?? []) : [];
  const weeklyFocus: WeeklyFocusEntry[] = rawFocus.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    focusDate: r.focus_date as string,
    targetType: (r.target_type as FocusTargetType) ?? 'brand',
    targetId: (r.target_id as string | null) ?? null,
    targetName: (r.target_name as string | null) ?? '',
    targetColor: (r.target_color as string | null) ?? '#C9A84C',
    notes: (r.notes as string | null) ?? '',
    metricsCache: (r.metrics_cache as Record<string, unknown> | null) ?? {},
  }));

  const rawTasks = tasksRes.status === 'fulfilled' && !tasksRes.value.error ? (tasksRes.value.data ?? []) : [];
  const activeTasks = rawTasks.map((t: Record<string, unknown>) => {
    const brand = brands.find(b => b.id === t.brand_id);
    type SubtaskItem = { id: string; title: string; status?: string; completed?: boolean };
    type SubtaskGroupItem = { subtasks?: SubtaskItem[] };
    const rawSubtasks: SubtaskItem[] = Array.isArray(t.subtasks) ? (t.subtasks as SubtaskItem[]) : [];
    const rawGroups: SubtaskGroupItem[] = Array.isArray(t.subtask_groups) ? (t.subtask_groups as SubtaskGroupItem[]) : [];
    const allSubtasks: { id: string; title: string; completed: boolean }[] = [];
    if (rawGroups.length > 0) {
      rawGroups.forEach(g => { (g.subtasks ?? []).forEach(st => { allSubtasks.push({ id: st.id, title: st.title, completed: st.status === 'done' }); }); });
    } else {
      rawSubtasks.forEach(st => { allSubtasks.push({ id: st.id, title: st.title, completed: st.status === 'done' || st.completed === true }); });
    }
    type ChecklistItem = { id: string; text: string; done: boolean };
    const checklist: ChecklistItem[] = Array.isArray(t.checklist) ? (t.checklist as ChecklistItem[]) : [];
    return {
      id: t.id as string,
      title: t.title as string,
      status: (t.status as string) ?? 'todo',
      priority: (t.priority as string) ?? 'medium',
      dueDate: (t.due_date as string | null) ?? null,
      brandId: (t.brand_id as string | null) ?? null,
      brandName: brand?.name ?? null,
      brandColor: brand?.color ?? null,
      projectId: (t.project_id as string | null) ?? null,
      hasDescription: !!t.description,
      subtasks: allSubtasks,
      checklist,
    };
  });

  const rawProjects = projectsRes.status === 'fulfilled' && !projectsRes.value.error ? (projectsRes.value.data ?? []) : [];
  const projects = rawProjects.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    brandId: (p.brand_id as string | null) ?? null,
    title: p.title as string,
    status: (p.status as string) ?? 'active',
    priority: (p.priority as string) ?? 'medium',
    targetDate: (p.target_date as string | null) ?? null,
    progress: (p.progress as number) ?? 0,
  }));

  const rawPersonal = personalTasksRes.status === 'fulfilled' && !personalTasksRes.value.error ? (personalTasksRes.value.data ?? []) : [];
  const personalTasks = rawPersonal.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    title: p.title as string,
    status: (p.status as string) ?? 'todo',
    priority: (p.priority as string) ?? 'medium',
    category: (p.category as string) ?? 'personal',
  }));

  const rawDecisions = decisionsRes.status === 'fulfilled' && !decisionsRes.value.error ? (decisionsRes.value.data ?? []) : [];
  const decisions: DecisionRow[] = rawDecisions.map((d: Record<string, unknown>) => ({
    id: d.id as string,
    brand_id: (d.brand_id as string | null) ?? null,
    project_id: (d.project_id as string | null) ?? null,
    title: d.title as string,
    context: (d.context as string | null) ?? null,
    options: (d.options as DecisionRow['options']) ?? [],
    chosen_option_id: (d.chosen_option_id as string | null) ?? null,
    status: (d.status as DecisionRow['status']) ?? 'open',
    impact: (d.impact as DecisionRow['impact']) ?? 'medium',
    deadline: (d.deadline as string | null) ?? null,
    decided_at: (d.decided_at as string | null) ?? null,
    decided_by: (d.decided_by as string | null) ?? null,
    notes: (d.notes as string | null) ?? null,
    updated_at: (d.updated_at as string) ?? new Date().toISOString(),
  }));

  const rawEmployees = employeesRes.status === 'fulfilled' && !employeesRes.value.error ? (employeesRes.value.data ?? []) : [];
  const employees: EmployeeRow[] = rawEmployees.map((e: Record<string, unknown>) => ({
    id: e.id as string,
    name: e.name as string,
    role: (e.role as string) ?? '',
    brand_ids: (e.brand_ids as string[]) ?? [],
    salary_type: (e.salary_type as EmployeeRow['salary_type']) ?? 'fixed',
    salary_amount: (e.salary_amount as number) ?? 0,
    salary_unit: (e.salary_unit as string | null) ?? null,
    reports_to: (e.reports_to as string | null) ?? null,
    status: (e.status as EmployeeRow['status']) ?? 'active',
    created_at: (e.created_at as string) ?? new Date().toISOString(),
    updated_at: (e.updated_at as string) ?? new Date().toISOString(),
  }));

  const rawInbox = inboxRes.status === 'fulfilled' && !inboxRes.value.error ? (inboxRes.value.data ?? []) : [];
  const inboxTasks: InboxTask[] = rawInbox.map((t: Record<string, unknown>) => ({
    id: t.id as string,
    text: t.text as string,
    created_at: t.created_at as string,
  }));

  const rawEvents = eventsRes.status === 'fulfilled' && !eventsRes.value.error ? (eventsRes.value.data ?? []) : [];
  const upcomingEvents = rawEvents.map((e: Record<string, unknown>) => {
    const brand = brands.find(b => b.id === e.brand_id);
    return {
      id: e.id as string,
      title: e.title as string,
      day: e.day as number,
      month: e.month as number,
      year: e.year as number,
      brandId: (e.brand_id as string | null) ?? null,
      brandName: brand?.name ?? null,
      brandColor: brand?.color ?? null,
    };
  });

  const rawSales = salesRes.status === 'fulfilled' && !salesRes.value.error ? (salesRes.value.data ?? []) : [];
  const todaySales = rawSales.reduce((sum: number, o: Record<string, unknown>) => sum + ((o.total_amount as number) ?? 0), 0);

  const rawDailyRoutines = dailyRoutinesRes.status === 'fulfilled' && !dailyRoutinesRes.value.error ? (dailyRoutinesRes.value.data ?? []) : [];
  const dailyRoutines: DailyRoutine[] = rawDailyRoutines.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    meta: (r.meta as string) ?? '',
    timeStr: (r.time_str as string) ?? '',
    isDone: (r.is_done as boolean) ?? false,
    sortOrder: (r.sort_order as number) ?? 0,
  }));

  return (
    <LeadershipClient
      brands={brands}
      weeklyFocus={weeklyFocus}
      activeTasks={activeTasks}
      projects={projects}
      personalTasks={personalTasks}
      decisions={decisions}
      employees={employees}
      inboxTasks={inboxTasks}
      upcomingEvents={upcomingEvents}
      todaySales={todaySales}
      dailyTasks={[]}
      dailyRoutines={dailyRoutines}
    />
  );
}
