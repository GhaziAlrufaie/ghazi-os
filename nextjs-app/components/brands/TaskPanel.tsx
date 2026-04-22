'use client';
// TaskPanel — لوحة تفاصيل المهمة الجانبية
// Side drawer من اليمين — مطابق لـ index.html الأصلي
import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority, SubtaskItem } from '@/lib/tasks-actions';
import { updateTask } from '@/lib/tasks-actions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandRow { id: string; name: string; color: string; }

interface ActivityItem {
  id: string;
  text: string;
  ts: string;
  type: 'action' | 'comment';
}

interface LinkItem { id: string; url: string; label: string; }

interface SubtaskStep {
  id: string;
  text: string;
  done: boolean;
}

interface SubtaskGroup {
  id: string;
  title: string;
  collapsed: boolean;
  steps: SubtaskStep[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CHIPS: { v: TaskStatus; lbl: string; color: string }[] = [
  { v: 'todo',        lbl: 'قيد الانتظار',  color: '#2196f3' },
  { v: 'in_progress', lbl: 'جاري التنفيذ',  color: '#ff9800' },
  { v: 'on_hold',     lbl: 'معلق',           color: '#e91e63' },
  { v: 'done',        lbl: 'منجز',           color: '#4caf50' },
  { v: 'ideas',       lbl: '💡 أفكار',       color: '#9c27b0' },
];

const PRI_CHIPS: { v: TaskPriority; lbl: string; color: string }[] = [
  { v: 'critical', lbl: '🔴 حرج',      color: '#f44336' },
  { v: 'high',     lbl: '🟠 عالي',     color: '#ff9800' },
  { v: 'medium',   lbl: '🟡 متوسط',    color: '#ffc107' },
  { v: 'low',      lbl: '⬇️ منخفض',   color: '#9e9e9e' },
];

const STATUS_CHIP_CLASS: Record<TaskStatus, string> = {
  todo:        'status-todo',
  in_progress: 'status-in_progress',
  on_hold:     'status-on_hold',
  waiting:     'status-on_hold',
  done:        'status-done',
  ideas:       'status-ideas',
};

const PRI_CHIP_CLASS: Record<TaskPriority, string> = {
  critical: 'pri-critical',
  high:     'pri-high',
  medium:   'pri-medium',
  low:      'pri-low',
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskPanelProps {
  task: Task | null;
  brands?: BrandRow[];
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
}

// ─── Dropdown Component ───────────────────────────────────────────────────────
function Dropdown<T extends string>({
  value,
  chips,
  chipClass,
  onChange,
}: {
  value: T;
  chips: { v: T; lbl: string; color: string }[];
  chipClass: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = chips.find((c) => c.v === value) ?? chips[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tp-dd-wrap" ref={ref}>
      <div
        className={`tp-dd-btn tp-chip ${chipClass[value]}`}
        onClick={() => setOpen((o) => !o)}>
        {active.lbl}
      </div>
      <div className={`tp-dd-menu${open ? ' open' : ''}`}>
        {chips.map((c) => (
          <div
            key={c.v}
            className={`tp-dd-item${c.v === value ? ' active' : ''}`}
            onClick={() => { onChange(c.v); setOpen(false); }}>
            <span className="tp-dd-dot" style={{ background: c.color }} />
            {c.lbl}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GroupRing SVG ─────────────────────────────────────────────────────────────
function GroupRing({ done, total }: { done: number; total: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const offset = circ * (1 - pct);
  const color = pct === 1 ? '#22c55e' : pct > 0 ? '#4D96FF' : '#EDE0CC';

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r={r} fill="none" stroke="#EDE0CC" strokeWidth="2.5" />
      {pct > 0 && (
        <circle
          cx="11" cy="11" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
        />
      )}
    </svg>
  );
}

// ─── SubtaskGroupsSection ──────────────────────────────────────────────────────
function SubtaskGroupsSection({
  subtasks,
  onSubtasksChange,
  groups,
  onChange,
}: {
  subtasks: SubtaskItem[];
  onSubtasksChange: (updated: SubtaskItem[]) => void;
  groups: SubtaskGroup[];
  onChange: (groups: SubtaskGroup[]) => void;
}) {
  const [newStepText, setNewStepText] = React.useState('');
  const newStepRef = React.useRef<HTMLInputElement>(null);

  // ── حساب الإجمالي الكلي ──
  const flatDone   = subtasks.filter((s) => s.done).length;
  const groupSteps = groups.reduce((acc, g) => acc + g.steps.length, 0);
  const groupDone  = groups.reduce((acc, g) => acc + g.steps.filter((s) => s.done).length, 0);
  const totalAll   = subtasks.length + groupSteps;
  const doneAll    = flatDone + groupDone;
  const pct        = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  // ── Flat subtasks handlers ──
  function toggleFlat(id: string) {
    onSubtasksChange(subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s));
  }
  function deleteFlat(id: string) {
    onSubtasksChange(subtasks.filter((s) => s.id !== id));
  }
  function addFlatStep() {
    const text = newStepText.trim();
    if (!text) return;
    const st: SubtaskItem = { id: `st_${Date.now()}`, title: text, done: false };
    onSubtasksChange([...subtasks, st]);
    setNewStepText('');
  }

  // ── Groups handlers ──
  function addGroup() {
    const newGroup: SubtaskGroup = {
      id: `grp_${Date.now()}`,
      title: 'مجموعة جديدة',
      collapsed: false,
      steps: [],
    };
    onChange([...groups, newGroup]);
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.sg-group-name');
      const last = inputs[inputs.length - 1];
      if (last) { last.focus(); last.select(); }
    }, 50);
  }
  function deleteGroup(gid: string) {
    onChange(groups.filter((g) => g.id !== gid));
  }
  function updateGroupTitle(gid: string, title: string) {
    onChange(groups.map((g) => g.id === gid ? { ...g, title } : g));
  }
  function toggleCollapse(gid: string) {
    onChange(groups.map((g) => g.id === gid ? { ...g, collapsed: !g.collapsed } : g));
  }
  function addStep(gid: string) {
    const newStep: SubtaskStep = { id: `stp_${Date.now()}`, text: 'مهمة جديدة', done: false };
    const updated = groups.map((g) =>
      g.id === gid ? { ...g, collapsed: false, steps: [...g.steps, newStep] } : g
    );
    onChange(updated);
    setTimeout(() => {
      const spans = document.querySelectorAll<HTMLSpanElement>(`[data-group="${gid}"] .sg-step-text`);
      const last = spans[spans.length - 1];
      if (last) {
        last.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(last);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  }
  function toggleStep(gid: string, sid: string) {
    onChange(groups.map((g) =>
      g.id === gid
        ? { ...g, steps: g.steps.map((s) => s.id === sid ? { ...s, done: !s.done } : s) }
        : g
    ));
  }
  function updateStepText(gid: string, sid: string, text: string) {
    onChange(groups.map((g) =>
      g.id === gid
        ? { ...g, steps: g.steps.map((s) => s.id === sid ? { ...s, text } : s) }
        : g
    ));
  }
  function deleteStep(gid: string, sid: string) {
    onChange(groups.map((g) =>
      g.id === gid ? { ...g, steps: g.steps.filter((s) => s.id !== sid) } : g
    ));
  }

  const showSection = totalAll > 0 || true; // دائماً يظهر القسم

  return (
    <div style={{ marginTop: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span className="tp-section-label" style={{ margin: 0, flex: 1 }}>
          ✅ المهام الفرعية {totalAll > 0 && <span style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 500 }}>({doneAll}/{totalAll})</span>}
        </span>
        <button
          onClick={addGroup}
          style={{
            background: 'none', border: 'none', fontFamily: 'inherit',
            fontSize: 11, color: 'var(--accent)', cursor: 'pointer',
            fontWeight: 700, padding: '4px 10px', borderRadius: 8,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,107,107,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          + مجموعة
        </button>
      </div>

      {/* ── Progress bar ── */}
      {totalAll > 0 && (
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%', borderRadius: 6,
            background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg, #FF6B6B, #FFD93D)',
            width: `${pct}%`, transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {/* ── قائمة المهام (flat subtasks) — المجموعة الافتراضية ── */}
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        {/* Header قائمة المهام */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: subtasks.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <GroupRing done={flatDone} total={subtasks.length} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--txt)', direction: 'rtl' }}>
            قائمة المهام
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            color: 'var(--txt3)', background: 'rgba(255,255,255,0.05)',
            padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {flatDone}/{subtasks.length}
          </span>
        </div>

        {/* Flat subtask items */}
        <div style={{ padding: '4px 12px 4px 12px' }}>
          {subtasks.map((st) => (
            <div
              key={st.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 4px', borderRadius: 8,
                transition: 'background 0.15s', direction: 'rtl',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                onClick={() => toggleFlat(st.id)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: st.done ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  background: st.done ? '#22c55e' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {st.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{
                flex: 1, fontSize: 13, direction: 'rtl',
                color: st.done ? 'var(--txt3)' : 'var(--txt)',
                textDecoration: st.done ? 'line-through' : 'none',
              }}>
                {st.title}
              </span>
              <button
                onClick={() => deleteFlat(st.id)}
                className="sg-step-del"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--txt3)', fontSize: 10, padding: '2px 4px',
                  opacity: 0, transition: 'opacity 0.15s', borderRadius: 4,
                }}
              >✕</button>
            </div>
          ))}
          {/* Add step input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', direction: 'rtl' }}>
            <div style={{ width: 18, height: 18, flexShrink: 0 }} />
            <input
              ref={newStepRef}
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addFlatStep(); }}
              placeholder="+ أضف خطوة... اضغط Enter للحفظ"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, color: 'var(--txt3)', fontFamily: 'inherit',
                direction: 'rtl', padding: 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Named Groups ── */}
      {groups.map((group) => {
        const gDone  = group.steps.filter((s) => s.done).length;
        const gTotal = group.steps.length;
        return (
          <div
            key={group.id}
            data-group={group.id}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            {/* Group Header */}
            <div
              className="sg-group-header"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: !group.collapsed && gTotal > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              {/* Arrow */}
              <span
                onClick={() => toggleCollapse(group.id)}
                style={{
                  fontSize: 11, color: 'var(--txt3)', flexShrink: 0, width: 14,
                  transition: 'transform 0.2s', cursor: 'pointer',
                  transform: group.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}
              >▾</span>
              {/* Ring */}
              <div onClick={() => toggleCollapse(group.id)}>
                <GroupRing done={gDone} total={gTotal} />
              </div>
              {/* Title input */}
              <input
                className="sg-group-name"
                value={group.title}
                onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 13, fontWeight: 600, color: 'var(--txt)',
                  fontFamily: 'inherit', cursor: 'text', direction: 'rtl',
                }}
              />
              {/* Badge */}
              <span style={{
                fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                color: 'var(--txt3)', background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}>
                {gDone}/{gTotal}
              </span>
              {/* Add step btn */}
              <button
                className="sg-g-btn"
                onClick={(e) => { e.stopPropagation(); addStep(group.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--txt3)', fontSize: 14, padding: '2px 6px',
                  opacity: 0, transition: 'opacity 0.15s', borderRadius: 6,
                }}
              >+</button>
              {/* Delete group btn */}
              <button
                className="sg-g-btn"
                onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--txt3)', fontSize: 11, padding: '2px 6px',
                  opacity: 0, transition: 'opacity 0.15s', borderRadius: 6,
                }}
              >🗑️</button>
            </div>

            {/* Steps */}
            {!group.collapsed && (
              <div style={{ padding: '4px 12px 8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.steps.map((step) => (
                  <div
                    key={step.id}
                    className="sg-step-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 4px', borderRadius: 8,
                      transition: 'background 0.15s', direction: 'rtl',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleStep(group.id, step.id)}
                      style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: step.done ? 'none' : '2px solid rgba(255,255,255,0.2)',
                        background: step.done ? '#22c55e' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {step.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    {/* Text */}
                    <span
                      className="sg-step-text"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const text = e.currentTarget.textContent?.trim() || '';
                        if (!text) { deleteStep(group.id, step.id); return; }
                        updateStepText(group.id, step.id, text);
                      }}
                      style={{
                        flex: 1, outline: 'none', fontSize: 13,
                        color: step.done ? 'var(--txt3)' : 'var(--txt)',
                        textDecoration: step.done ? 'line-through' : 'none',
                        direction: 'rtl', cursor: 'text',
                      }}
                    >
                      {step.text}
                    </span>
                    {/* Delete step */}
                    <button
                      onClick={() => deleteStep(group.id, step.id)}
                      className="sg-step-del"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--txt3)', fontSize: 10, padding: '2px 4px',
                        opacity: 0, transition: 'opacity 0.15s', borderRadius: 4,
                      }}
                    >✕</button>
                  </div>
                ))}
                {/* Empty state */}
                {group.steps.length === 0 && (
                  <div
                    onClick={() => addStep(group.id)}
                    style={{
                      padding: '8px 4px', fontSize: 12, color: 'var(--txt3)',
                      cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s',
                      direction: 'rtl',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    + أضف خطوة
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── إضافة مجموعة جديدة ── */}
      <button
        onClick={addGroup}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '8px 12px',
          fontSize: 12, color: 'var(--txt3)', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: 600,
          transition: 'all 0.15s', direction: 'rtl',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.color = 'var(--txt)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = 'var(--txt3)';
        }}
      >
        + إضافة مجموعة جديدة
      </button>

      {/* Inline CSS for hover effects */}
      <style>{`
        .sg-step-row:hover .sg-step-del { opacity: 1 !important; }
        .sg-group-header:hover .sg-g-btn { opacity: 1 !important; }
        .sg-step-row:hover .sg-step-del { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskPanelProps {
  task: Task | null;
  brands?: BrandRow[];
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
}

// ─── Dropdown Component ───────────────────────────────────────────────────────
function Dropdown<T extends string>({
  value,
  chips,
  chipClass,
  onChange,
}: {
  value: T;
  chips: { v: T; lbl: string; color: string }[];
  chipClass: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = chips.find((c) => c.v === value) ?? chips[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tp-dd-wrap" ref={ref}>
      <div
        className={`tp-dd-btn tp-chip ${chipClass[value]}`}
        onClick={() => setOpen((o) => !o)}>
        {active.lbl}
      </div>
      <div className={`tp-dd-menu${open ? ' open' : ''}`}>
        {chips.map((c) => (
          <div
            key={c.v}
            className={`tp-dd-item${c.v === value ? ' active' : ''}`}
            onClick={() => { onChange(c.v); setOpen(false); }}>
            <span className="tp-dd-dot" style={{ background: c.color }} />
            {c.lbl}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GroupRing SVG ─────────────────────────────────────────────────────────────
function GroupRing({ done, total }: { done: number; total: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const offset = circ * (1 - pct);
  const color = pct === 1 ? '#22c55e' : pct > 0 ? '#4D96FF' : '#EDE0CC';

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r={r} fill="none" stroke="#EDE0CC" strokeWidth="2.5" />
      {pct > 0 && (
        <circle
          cx="11" cy="11" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
        />
      )}
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskPanelProps {
  task: Task | null;
  brands?: BrandRow[];
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
}

// ─── Dropdown Component ───────────────────────────────────────────────────────
function Dropdown<T extends string>({
  value,
  chips,
  chipClass,
  onChange,
}: {
  value: T;
  chips: { v: T; lbl: string; color: string }[];
  chipClass: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = chips.find((c) => c.v === value) ?? chips[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tp-dd-wrap" ref={ref}>
      <div
        className={`tp-dd-btn tp-chip ${chipClass[value]}`}
        onClick={() => setOpen((o) => !o)}>
        {active.lbl}
      </div>
      <div className={`tp-dd-menu${open ? ' open' : ''}`}>
        {chips.map((c) => (
          <div
            key={c.v}
            className={`tp-dd-item${c.v === value ? ' active' : ''}`}
            onClick={() => { onChange(c.v); setOpen(false); }}>
            <span className="tp-dd-dot" style={{ background: c.color }} />
            {c.lbl}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GroupRing SVG ─────────────────────────────────────────────────────────────
function GroupRing({ done, total }: { done: number; total: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const offset = circ * (1 - pct);
  const color = pct === 1 ? '#22c55e' : pct > 0 ? '#4D96FF' : '#EDE0CC';

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r={r} fill="none" stroke="#EDE0CC" strokeWidth="2.5" />
      {pct > 0 && (
        <circle
          cx="11" cy="11" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
        />
      )}
    </svg>
  );
}

export default function TaskPanel({ task, onClose, onUpdate, onDelete, onArchive }: TaskPanelProps) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [status, setStatus]     = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate]   = useState('');
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [comment, setComment]   = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [newTag, setNewTag]     = useState('');
  const [links, setLinks]       = useState<LinkItem[]>([]);
  const [newLink, setNewLink]   = useState({ url: '', label: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [groups, setGroups]     = useState<SubtaskGroup[]>([]);

  // Sync state when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDesc(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    // تحميل subtasks من Supabase
    setSubtasks(Array.isArray(task.subtasks) ? (task.subtasks as SubtaskItem[]) : []);
    // تحميل subtask_groups من Supabase
    const rawGroups = task.subtask_groups;
    setGroups(Array.isArray(rawGroups) ? rawGroups : []);
    setActivity([]);
    setComment('');
    setTags([]);
    setLinks([]);
    setNewTag('');
    setNewLink({ url: '', label: '' });
    setShowLinkForm(false);
  }, [task?.id]);

  // Escape key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!task) return null;

  // ── Auto-save helpers ──
  async function saveTitle(val: string) {
    if (val === task!.title) return;
    await updateTask({ id: task!.id, title: val });
    onUpdate({ title: val });
  }

  async function saveDesc(val: string) {
    if (val === (task!.description ?? '')) return;
    await updateTask({ id: task!.id, description: val });
    onUpdate({ description: val });
  }

  async function changeStatus(v: TaskStatus) {
    setStatus(v);
    await updateTask({ id: task!.id, status: v });
    onUpdate({ status: v });
  }

  async function changePriority(v: TaskPriority) {
    setPriority(v);
    await updateTask({ id: task!.id, priority: v });
    onUpdate({ priority: v });
  }

  async function changeDueDate(val: string) {
    setDueDate(val);
    await updateTask({ id: task!.id, dueDate: val || null });
    onUpdate({ dueDate: val || null });
  }

  // ── Tags ──
  function addTag() {
    const t = newTag.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setNewTag('');
  }
  function removeTag(tag: string) { setTags((prev) => prev.filter((t) => t !== tag)); }

  // ── Links ──
  function addLink() {
    if (!newLink.url.trim()) return;
    setLinks((prev) => [...prev, { id: `lnk_${Date.now()}`, url: newLink.url.trim(), label: newLink.label.trim() || newLink.url.trim() }]);
    setNewLink({ url: '', label: '' });
    setShowLinkForm(false);
  }
  function removeLink(id: string) { setLinks((prev) => prev.filter((l) => l.id !== id)); }

  // ── SubtaskGroups ──
  async function handleGroupsChange(updated: SubtaskGroup[]) {
    setGroups(updated);
    // حفظ في Supabase — نستخدم subtask_groups column مباشرة
    await updateTask({ id: task!.id, subtask_groups: updated });
  }

  // ── Activity ──
  function addComment() {
    if (!comment.trim()) return;
    const item: ActivityItem = {
      id: `act_${Date.now()}`,
      text: comment.trim(),
      ts: new Date().toLocaleString('ar-SA'),
      type: 'comment',
    };
    setActivity((prev) => [item, ...prev]);
    setComment('');
  }

  // ── Delete / Archive ──
  function handleDelete() {
    onDelete(task!.id);
    onClose();
  }

  function handleArchive() {
    onArchive(task!);
    onClose();
  }

  const stDone = subtasks.filter((s) => s.done).length;

  // حساب الإجمالي الكلي (flat subtasks + group steps)
  const allGroupSteps = groups.reduce((acc, g) => acc + g.steps.length, 0);
  const allGroupDone  = groups.reduce((acc, g) => acc + g.steps.filter((s) => s.done).length, 0);
  const totalAll = subtasks.length + allGroupSteps;
  const doneAll  = stDone + allGroupDone;
  const pctAll   = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="task-panel-overlay on"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="task-panel on" dir="rtl">
        {/* Header */}
        <div className="tp-header">
          <div>
            <div className="tp-breadcrumb">
              <span>المهام</span>
              <span>›</span>
              <span style={{ color: 'var(--txt)' }}>{task.title.slice(0, 30)}{task.title.length > 30 ? '...' : ''}</span>
            </div>
          </div>
          <div className="tp-actions">
            <span className="tp-task-id">{task.id.slice(0, 12)}</span>
            <button
              className="tp-copy-btn"
              onClick={() => navigator.clipboard.writeText(task.id)}
              title="نسخ المعرّف">
              نسخ
            </button>
            <button className="tp-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="tp-body">
          {/* Main Column */}
          <div className="tp-col-main">
            {/* Title */}
            <input
              className="tp-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => saveTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              placeholder="عنوان المهمة..."
            />

            {/* Description */}
            <textarea
              className="tp-desc-area"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={(e) => saveDesc(e.target.value)}
              placeholder="أضف وصفاً..."
              rows={4}
            />

            {/* Tags */}
            <div className="tp-section-label" style={{ marginTop: 16 }}>🏷️ التصنيفات</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map((tag) => (
                <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: 'var(--txt2)' }}>
                  #{tag}
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 0, fontSize: 10 }}>✕</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }} placeholder="+ أضف تصنيف..." style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: 'var(--txt1)', outline: 'none' }} />
              <button className="btn btn-sm" onClick={addTag}>+</button>
            </div>

            {/* Links */}
            <div className="tp-section-label" style={{ marginTop: 16 }}>🔗 الروابط</div>
            {links.map((lnk) => (
              <div key={lnk.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 12 }}>🔗</span>
                <a href={lnk.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 11, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lnk.label}</a>
                <button onClick={() => removeLink(lnk.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 10 }}>✕</button>
              </div>
            ))}
            {showLinkForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={newLink.url} onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: 'var(--txt1)', outline: 'none' }} />
                <input value={newLink.label} onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))} placeholder="التسمية (اختياري)" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: 'var(--txt1)', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={addLink}>إضافة</button>
                  <button className="btn btn-sm btn-plain" onClick={() => setShowLinkForm(false)}>إلغاء</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-sm btn-plain" onClick={() => setShowLinkForm(true)}>+ رابط جديد</button>
            )}

                        {/* المهام الفرعية — قائمة موحدة (flat + groups) */}
            <SubtaskGroupsSection
              subtasks={subtasks}
              onSubtasksChange={async (updated) => {
                setSubtasks(updated);
                await updateTask({ id: task!.id, subtasks: updated });
              }}
              groups={groups}
              onChange={handleGroupsChange}
            />

            {/* Activity */}
            <div className="tp-section-label" style={{ marginTop: 24 }}>💬 النشاط</div>
            <textarea
              className="tp-comment-box"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
              placeholder="اكتب تعليقاً... (Ctrl+Enter للإرسال)"
              rows={3}
            />
            <button
              className="btn btn-sm"
              style={{ marginTop: 6 }}
              onClick={addComment}
              disabled={!comment.trim()}>
              إرسال
            </button>
            {activity.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {activity.map((a) => (
                  <div key={a.id} className="tp-activity-item">
                    <div className={`tp-activity-dot${a.type === 'comment' ? ' comment' : ''}`} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--txt)' }}>{a.text}</div>
                      <div className="tp-activity-time">{a.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Column */}
          <div className="tp-col-side">
            {/* Status */}
            <div className="tp-section-label">الحالة</div>
            <Dropdown
              value={status}
              chips={STATUS_CHIPS}
              chipClass={STATUS_CHIP_CLASS}
              onChange={changeStatus}
            />

            {/* Priority */}
            <div className="tp-section-label">الأولوية</div>
            <Dropdown
              value={priority}
              chips={PRI_CHIPS}
              chipClass={PRI_CHIP_CLASS}
              onChange={changePriority}
            />

            {/* Due Date */}
            <div className="tp-section-label">📅 الموعد النهائي</div>
            <input
              type="date"
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--brd)',
                borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--txt)',
                fontFamily: 'inherit', outline: 'none',
              }}
              value={dueDate}
              onChange={(e) => changeDueDate(e.target.value)}
            />

            {/* Progress summary */}
            {totalAll > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="tp-section-label">📊 التقدم الكلي</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6,
                      background: pctAll === 100 ? '#22c55e' : 'linear-gradient(90deg, #FF6B6B, #FFD93D)',
                      width: `${pctAll}%`, transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--txt2)', minWidth: 36 }}>
                    {pctAll}%
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
                  {doneAll} من {totalAll} خطوة مكتملة
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-sm"
                style={{ width: '100%' }}
                onClick={handleArchive}>
                🗄️ أرشفة
              </button>
              <button
                className="btn btn-sm btn-plain"
                style={{ width: '100%', color: 'var(--danger)' }}
                onClick={handleDelete}>
                🗑 حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
