'use client';
// ProjectsClient — بنك الأفكار المركزي (Idea Dispatcher)
// Shows ONLY tasks with status='ideas' from all brands
// Drop zones for other columns allow dispatching ideas to workflow
// DnD updates the shared tasks table → instantly reflected in Brand boards
import React, { useState, useCallback, useTransition, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { BrandRow } from '@/lib/brands-types';
import type { Task, TaskStatus } from '@/lib/tasks-actions';
import { updateTask, archiveTask, deleteTask } from '@/lib/tasks-actions';
import TaskPanel from '@/components/brands/TaskPanel';

// ─── Constants — MUST match BrandDetailClient exactly ─────────────────────────
const KANBAN_COLS: { id: TaskStatus; name: string; color: string }[] = [
  { id: 'ideas',       name: '💡 أفكار',     color: '#8B5CF6' },
  { id: 'todo',        name: 'قيد الانتظار', color: '#3B82F6' },
  { id: 'in_progress', name: 'جاري التنفيذ', color: '#C9A84C' },
  { id: 'on_hold',     name: 'معلق',         color: '#F97316' },
  { id: 'done',        name: 'منجز',         color: '#10B981' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(dueDate: string | null): number {
  if (!dueDate) return 999;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}
function daysLeftLabel(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = daysLeft(dueDate);
  if (d < 0) return `متأخر ${Math.abs(d)} يوم`;
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غداً';
  return `${d} يوم`;
}
function isOverdue(task: Task): boolean {
  return !!task.dueDate && daysLeft(task.dueDate) < 0 && task.status !== 'done';
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  initialTasks: Task[];
  brands: BrandRow[];
}

export default function ProjectsClient({ initialTasks, brands }: Props) {
  const [tasks, setTasks]             = useState<Task[]>(initialTasks);
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [panelTask, setPanelTask]     = useState<Task | null>(null);
  const [, startTransition]           = useTransition();

  // ── Brand filter + Ideas-only filter ────────────────────────────────────────────────────────────────────────────────────
  // All tasks in state (includes dispatched tasks temporarily until page refresh)
  const brandFiltered = filterBrand === 'all'
    ? tasks
    : tasks.filter(t => t.brandId === filterBrand);

  // visibleTasks: only ideas (+ legacy 'projects') that haven't been dispatched yet
  // Once a task is dragged to another column, it stays visible locally until refresh
  const visibleTasks = brandFiltered;

  // ── Stats (ideas-focused) ─────────────────────────────────────────────────────────────────────────────────────
  const totalTasks  = visibleTasks.length;
  const doneTasks   = visibleTasks.filter(t => t.status === 'done').length;
  const activeTasks = visibleTasks.filter(t => t.status === 'in_progress').length;
  const ideasCount  = visibleTasks.filter(t =>
    t.status === 'ideas' || (t.status as string) === 'projects'
  ).length;

  // ── DnD — updates same tasks table as Brands ────────────────────────────────────────────────────────────────────────────────────
  // Browser-side Supabase client for DnD (avoids Server Action revalidation delay)
  const supabaseBrowser = useMemo(() => createBrowserClient(), []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    const taskId = draggableId;
    const prevTasks = tasks;

    // OPTIMISTIC UI UPDATE — instant, no blurry state
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // DIRECT SUPABASE SYNC (browser client — no revalidatePath, no page reload)
    try {
      const { error } = await supabaseBrowser
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      if (error) throw error;
    } catch (err: unknown) {
      console.error('DnD DB Update Failed:', err);
      setTasks(prevTasks);
    }
  }, [tasks, supabaseBrowser]);

  // ── Task Panel handlers ───────────────────────────────────────────────────
  function handleUpdate(patch: Partial<Task>) {
    if (!panelTask) return;
    const updated = { ...panelTask, ...patch };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setPanelTask(updated);
  }
  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    setPanelTask(null);
    deleteTask(id).catch(() => {});
  }
  function handleArchive(task: Task) {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    setPanelTask(null);
    archiveTask(task).catch(() => {});
  }

  return (
    <div style={{ padding: '28px 24px', minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── VIP Header ── */}
      <div className="vip-brand-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#F5F3FF', padding: 12, borderRadius: 12, fontSize: 24 }}>💡</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0F172A' }}>💡 بنك الأفكار المركزي</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B', marginTop: 2 }}>
              غرفة مراجعة واعتماد الأفكار من جميع البراندات — اسحب الفكرة لاعتمادها وسيتم ترحيلها للبراند
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'إجمالي المهام', value: totalTasks,  color: '#8B5CF6' },
            { label: 'قيد التنفيذ',  value: activeTasks, color: '#C9A84C' },
            { label: 'منجزة',        value: doneTasks,   color: '#10B981' },
            { label: 'أفكار',        value: ideasCount,  color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Brand Filter ── */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>🏢 فلتر البراند:</span>
        <select
          value={filterBrand}
          onChange={e => setFilterBrand(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', color: '#1E293B',
            background: '#FFFFFF', cursor: 'pointer', outline: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
          <option value="all">🌐 جميع البراندات ({tasks.filter(t => t.status === 'ideas' || (t.status as string) === 'projects').length} فكرة)</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>
              {b.name} ({tasks.filter(t => t.brandId === b.id && (t.status === 'ideas' || (t.status as string) === 'projects')).length} فكرة)
            </option>
          ))}
        </select>
        {filterBrand !== 'all' && (
          <button
            onClick={() => setFilterBrand('all')}
            style={{
              padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
              background: '#F1F5F9', color: '#64748B', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            ✕ إلغاء الفلتر
          </button>
        )}
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="vip-kanban-board">
            {KANBAN_COLS.map(col => {
              // Self-heal: tasks with legacy status='projects' appear in أفكار
              const colTasks = visibleTasks.filter(t =>
                t.status === col.id ||
                (col.id === 'ideas' && (t.status as string) === 'projects')
              );
              return (
                <div key={col.id} className="vip-kanban-column">
                  <div className="vip-column-header">
                    <h3 className="vip-column-title">
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: col.color, display: 'inline-block', flexShrink: 0,
                      }} />
                      <span>{col.name}</span>
                    </h3>
                    <div className="vip-column-count">{colTasks.length}</div>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`vip-tasks-container${snapshot.isDraggingOver ? ' vip-kanban-drag-over' : ''}`}
                        style={{ minHeight: 120, overflow: 'visible' }}>
                        {colTasks.map((task, index) => {
                          const brand = brands.find(b => b.id === task.brandId);
                          const overdue = isOverdue(task);
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  className={`vip-task-card${snap.isDragging ? ' dragging' : ''}`}
                                  onClick={() => setPanelTask(task)}
                                  style={{ ...prov.draggableProps.style, cursor: 'pointer' }}>
                                  <h4 className="vip-task-title">{task.title}</h4>
                                  <div className="vip-card-tags">
                                    {/* Brand tag — always shown on global board */}
                                    {brand && (
                                      <span className="vip-tag" style={{
                                        background: '#EFF6FF', color: '#1D4ED8',
                                        border: '1px solid #BFDBFE',
                                      }}>
                                        🏢 {brand.name}
                                      </span>
                                    )}
                                    {task.priority === 'critical' && <span className="vip-tag" style={{ background: '#FEF2F2', color: '#DC2626' }}>🔴 حرج</span>}
                                    {task.priority === 'high'     && <span className="vip-tag" style={{ background: '#FFF7ED', color: '#EA580C' }}>🟠 عالي</span>}
                                    {task.priority === 'medium'   && <span className="vip-tag" style={{ background: '#EFF6FF', color: '#2563EB' }}>🟡 متوسط</span>}
                                    {task.priority === 'low'      && <span className="vip-tag" style={{ background: '#F0FDF4', color: '#16A34A' }}>⬇️ منخفض</span>}
                                    {overdue  && <span className="vip-tag-overdue">⚠️ متأخر {Math.abs(daysLeft(task.dueDate))} يوم</span>}
                                    {!overdue && task.dueDate && <span className="vip-tag-due">🗓 {daysLeftLabel(task.dueDate)}</span>}
                                    {task.hasDescription && <span className="vip-tag">📝</span>}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* ── Task Panel (same VIP modal as Brands) ── */}
      <TaskPanel
        task={panelTask}
        onClose={() => setPanelTask(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onArchive={handleArchive}
      />
    </div>
  );
}
