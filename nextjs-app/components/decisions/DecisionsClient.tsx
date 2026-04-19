'use client';
// Ghazi OS — Legendary Edition
// DecisionsClient — حسم، تعديل، إضافة، أرشفة، إعادة فتح

import { useState, useTransition } from 'react';
import type { Decision, DecisionOption, Brand } from '@/app/decisions/page';
import {
  addDecision,
  decideNow,
  revisitDecision,
  saveDecision,
  deleteDecision,
  archiveDecision,
  restoreDecision,
} from '@/lib/decisions-actions';
import { useGlobal } from '@/components/GlobalProviders';

interface Props {
  initialPending: Decision[];
  initialDecided: Decision[];
  brands: Brand[];
}

const IMPACT_LABELS: Record<string, string> = { high: 'عالي', medium: 'متوسط', low: 'منخفض' };
const IMPACT_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#C9963B',
  low: '#22c55e',
};

function daysLeft(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysLeftLabel(deadline: string): string {
  const d = daysLeft(deadline);
  if (d < 0) return `تأخر ${Math.abs(d)} يوم`;
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غداً';
  return `${d} يوم`;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function DecisionsClient({ initialPending, initialDecided, brands }: Props) {
  const { pushUndo } = useGlobal();
  const [pending, setPending] = useState<Decision[]>(initialPending);
  const [decided, setDecided] = useState<Decision[]>(initialDecided);
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add form state
  const [addForm, setAddForm] = useState({
    title: '', brandId: '', options: '', impact: 'high' as 'high' | 'medium' | 'low', deadline: '',
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '', context: '', deadline: '', impact: 'medium' as 'high' | 'medium' | 'low', notes: '',
  });

  const getBrand = (id: string | null) => brands.find((b) => b.id === id);

  function handleSelectOpt(decId: string, optId: string) {
    setSelectedOpts((prev) => ({ ...prev, [decId]: optId }));
  }

  function handleDecide(decId: string) {
    const optId = selectedOpts[decId];
    if (!optId) return;
    startTransition(async () => {
      const res = await decideNow(decId, optId);
      if (res.ok && res.decision) {
        setPending((prev) => prev.filter((d) => d.id !== decId));
        setDecided((prev) => [res.decision!, ...prev]);
        setSelectedOpts((prev) => { const n = { ...prev }; delete n[decId]; return n; });
      }
    });
  }

  function handleRevisit(decId: string) {
    startTransition(async () => {
      const res = await revisitDecision(decId);
      if (res.ok && res.decision) {
        setDecided((prev) => prev.filter((d) => d.id !== decId));
        setPending((prev) => {
          const sorted = [...prev, res.decision!].sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.impact] ?? 1) - (order[b.impact] ?? 1);
          });
          return sorted;
        });
      }
    });
  }

  function handleArchive(decId: string) {
    startTransition(async () => {
      const res = await archiveDecision(decId);
      if (res.ok) {
        setPending((prev) => prev.filter((d) => d.id !== decId));
        setDecided((prev) => prev.filter((d) => d.id !== decId));
      }
    });
  }

  function handleDelete(decId: string) {
    const dec = [...pending, ...decided].find((d) => d.id === decId);
    if (!dec) return;
    startTransition(async () => {
      const res = await deleteDecision(decId);
      if (res.ok) {
        setPending((prev) => prev.filter((d) => d.id !== decId));
        setDecided((prev) => prev.filter((d) => d.id !== decId));
        setEditingDecision(null);
        pushUndo({
          label: `حذف "قرار: ${dec.title}"`,
          undo: async () => {
            await restoreDecision(dec);
            if (dec.status === 'pending') setPending((prev) => [...prev, dec]);
            else setDecided((prev) => [...prev, dec]);
          },
        });
      }
    });
  }

  function openEdit(dec: Decision) {
    setEditingDecision(dec);
    setEditForm({
      title: dec.title,
      context: dec.context,
      deadline: dec.deadline ?? '',
      impact: dec.impact,
      notes: dec.notes,
    });
  }

  function handleSaveEdit() {
    if (!editingDecision) return;
    startTransition(async () => {
      const res = await saveDecision(editingDecision.id, editForm);
      if (res.ok && res.decision) {
        const updated = res.decision;
        if (updated.status === 'pending') {
          setPending((prev) => prev.map((d) => d.id === updated.id ? updated : d));
        } else {
          setDecided((prev) => prev.map((d) => d.id === updated.id ? updated : d));
        }
        setEditingDecision(null);
      }
    });
  }

  function handleAdd() {
    const title = addForm.title.trim();
    if (!title) return;
    const opts = addForm.options.split(',').map((x) => x.trim()).filter(Boolean);
    if (opts.length < 2) { alert('أدخل خيارين على الأقل'); return; }
    const newDec: Decision = {
      id: genId(),
      brand_id: addForm.brandId || null,
      project_id: null,
      title,
      context: '',
      options: opts.map((o) => ({ id: genId(), title: o, pros: [], cons: [], estimatedCost: null, estimatedRevenue: null })),
      chosen_option_id: null,
      status: 'pending',
      impact: addForm.impact,
      deadline: addForm.deadline || null,
      decided_at: null,
      decided_by: 'غازي',
      notes: '',
    };
    startTransition(async () => {
      const res = await addDecision(newDec);
      if (res.ok) {
        setPending((prev) => {
          const sorted = [...prev, newDec].sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.impact] ?? 1) - (order[b.impact] ?? 1);
          });
          return sorted;
        });
        setShowAddModal(false);
        setAddForm({ title: '', brandId: '', options: '', impact: 'high', deadline: '' });
      }
    });
  }

  return (
    <div className="scr on" dir="rtl">
      {/* رأس الصفحة */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">القرارات</h1>
            <p className="page-subtitle">
              {pending.length} معلق — {decided.length} محسوم
            </p>
          </div>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            + قرار جديد
          </button>
        </div>
      </div>

      {/* القرارات المعلقة */}
      <div style={{ maxWidth: 700 }}>
        {pending.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <div className="empty-title">كل القرارات محسومة!</div>
            <div className="empty-sub">لا توجد قرارات معلقة حالياً</div>
          </div>
        )}

        {pending.map((dec) => {
          const brand = getBrand(dec.brand_id);
          const selOptId = selectedOpts[dec.id];
          const selOpt = selOptId ? dec.options.find((o) => o.id === selOptId) : null;

          return (
            <div key={dec.id} className={`dec-card impact-${dec.impact}`}>
              {/* رأس البطاقة */}
              <div className="dec-header">
                <div className="dec-title">{dec.title}</div>
                <span
                  className="impact-badge"
                  style={{ background: `${IMPACT_COLORS[dec.impact]}22`, color: IMPACT_COLORS[dec.impact] }}
                >
                  {IMPACT_LABELS[dec.impact]}
                </span>
              </div>

              {/* الميتا */}
              <div className="dec-meta">
                {brand && (
                  <span className="brand-tag" style={{ background: `${brand.color}22`, color: brand.color }}>
                    {brand.name}
                  </span>
                )}
                {dec.deadline && (
                  <span
                    className="deadline-tag"
                    style={{ color: daysLeft(dec.deadline) < 3 ? '#ef4444' : 'var(--txt3)' }}
                  >
                    {daysLeftLabel(dec.deadline)}
                  </span>
                )}
                {dec.context && (
                  <span className="context-tag">{dec.context}</span>
                )}
              </div>

              {/* الخيارات */}
              <div className="dec-opts">
                {dec.options.map((opt) => (
                  <button
                    key={opt.id}
                    className={`dec-opt ${selOptId === opt.id ? 'selected' : ''}`}
                    onClick={() => handleSelectOpt(dec.id, opt.id)}
                  >
                    {opt.title}
                    {opt.estimatedRevenue != null && opt.estimatedRevenue > 0 && (
                      <span className="opt-revenue">+{opt.estimatedRevenue.toLocaleString('ar-SA')}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* إيجابيات/سلبيات الخيار المحدد */}
              {selOpt && (selOpt.pros.length > 0 || selOpt.cons.length > 0) && (
                <div className="pros-cons">
                  {selOpt.pros.length > 0 && (
                    <div>
                      <div className="pros-title">إيجابيات</div>
                      {selOpt.pros.map((p, i) => <div key={i} className="pros-item">• {p}</div>)}
                    </div>
                  )}
                  {selOpt.cons.length > 0 && (
                    <div>
                      <div className="cons-title">سلبيات</div>
                      {selOpt.cons.map((c, i) => <div key={i} className="cons-item">• {c}</div>)}
                    </div>
                  )}
                </div>
              )}

              {/* الأزرار */}
              <div className="dec-actions">
                <button
                  className={`btn-decide ${selOptId ? 'ready' : ''}`}
                  onClick={() => handleDecide(dec.id)}
                  disabled={!selOptId || isPending}
                >
                  حسمت ✓
                </button>
                <button className="btn-edit" onClick={() => openEdit(dec)} disabled={isPending}>
                  تعديل
                </button>
                <button
                  className="btn-archive"
                  onClick={() => handleArchive(dec.id)}
                  disabled={isPending}
                >
                  أرشف
                </button>
              </div>
            </div>
          );
        })}

        {/* القرارات المحسومة */}
        {decided.length > 0 && (
          <div>
            <div className="section-sep">محسومة ({decided.length})</div>
            {decided.map((dec) => {
              const chosenOpt = dec.options.find((o) => o.id === dec.chosen_option_id);
              return (
                <div key={dec.id} className="decided-card">
                  <div className="decided-header">
                    <div className="decided-title">{dec.title}</div>
                    {chosenOpt && (
                      <span className="chosen-badge">{chosenOpt.title}</span>
                    )}
                  </div>
                  {dec.decided_at && (
                    <div className="decided-date">
                      {new Date(dec.decided_at).toLocaleDateString('ar-SA')}
                    </div>
                  )}
                  {dec.notes && <div className="decided-notes">{dec.notes}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="btn-revisit" onClick={() => handleRevisit(dec.id)} disabled={isPending}>
                      إعادة فتح
                    </button>
                    <button className="btn-del-sm" onClick={() => handleDelete(dec.id)} disabled={isPending}>
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal إضافة قرار */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">قرار جديد</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <label className="field-label">سؤال القرار</label>
            <input
              className="field-input"
              placeholder="وش القرار؟"
              value={addForm.title}
              onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
              autoFocus
            />
            <label className="field-label">البراند</label>
            <select
              className="field-input"
              value={addForm.brandId}
              onChange={(e) => setAddForm((p) => ({ ...p, brandId: e.target.value }))}
            >
              <option value="">عام</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <label className="field-label">الخيارات (مفصولة بفاصلة)</label>
            <input
              className="field-input"
              placeholder="أكمل, ألغي, أؤجل"
              value={addForm.options}
              onChange={(e) => setAddForm((p) => ({ ...p, options: e.target.value }))}
            />
            <label className="field-label">الأثر</label>
            <select
              className="field-input"
              value={addForm.impact}
              onChange={(e) => setAddForm((p) => ({ ...p, impact: e.target.value as 'high' | 'medium' | 'low' }))}
            >
              <option value="high">عالي</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
            <label className="field-label">الموعد النهائي</label>
            <input
              type="date"
              className="field-input"
              value={addForm.deadline}
              onChange={(e) => setAddForm((p) => ({ ...p, deadline: e.target.value }))}
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>إلغاء</button>
              <button className="btn-save" onClick={handleAdd} disabled={isPending}>+ أضف</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal تعديل قرار */}
      {editingDecision && (
        <div className="modal-overlay" onClick={() => setEditingDecision(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">تعديل القرار</h2>
              <button className="modal-close" onClick={() => setEditingDecision(null)}>✕</button>
            </div>
            <label className="field-label">العنوان</label>
            <input
              className="field-input"
              value={editForm.title}
              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
            />
            <label className="field-label">السياق</label>
            <textarea
              className="field-input"
              rows={2}
              value={editForm.context}
              onChange={(e) => setEditForm((p) => ({ ...p, context: e.target.value }))}
            />
            <label className="field-label">الموعد النهائي</label>
            <input
              type="date"
              className="field-input"
              value={editForm.deadline}
              onChange={(e) => setEditForm((p) => ({ ...p, deadline: e.target.value }))}
            />
            <label className="field-label">الأثر</label>
            <select
              className="field-input"
              value={editForm.impact}
              onChange={(e) => setEditForm((p) => ({ ...p, impact: e.target.value as 'high' | 'medium' | 'low' }))}
            >
              <option value="high">عالي</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
            <label className="field-label">ملاحظات</label>
            <textarea
              className="field-input"
              rows={2}
              value={editForm.notes}
              onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
            />
            <div className="modal-actions">
              <button className="btn-danger-sm" onClick={() => handleDelete(editingDecision.id)} disabled={isPending}>حذف</button>
              <button className="btn-cancel" onClick={() => setEditingDecision(null)}>إلغاء</button>
              <button className="btn-save" onClick={handleSaveEdit} disabled={isPending}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container { padding: 24px; }
        .page-header { margin-bottom: 24px; }
        .page-title { font-size: 24px; font-weight: 800; color: var(--gold); margin: 0 0 4px; }
        .page-subtitle { font-size: 12px; color: var(--txt3); margin: 0; }
        .btn-add { background: rgba(201,150,59,0.15); border: 1px solid rgba(201,150,59,0.4); color: var(--gold); padding: 8px 16px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn-add:hover { background: rgba(201,150,59,0.25); }
        .dec-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(201,150,59,0.1); border-radius: 12px; padding: 16px; margin-bottom: 10px; transition: border-color 0.2s; }
        .dec-card.impact-high { border-right: 3px solid #ef4444; }
        .dec-card.impact-medium { border-right: 3px solid #C9963B; }
        .dec-card.impact-low { border-right: 3px solid #22c55e; }
        .dec-card:hover { border-color: rgba(201,150,59,0.25); }
        .dec-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 10px; }
        .dec-title { font-size: 14px; font-weight: 700; color: var(--txt1); line-height: 1.5; flex: 1; }
        .impact-badge { font-size: 10px; padding: 3px 8px; border-radius: 5px; font-weight: 600; flex-shrink: 0; }
        .dec-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; align-items: center; }
        .brand-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
        .deadline-tag { font-size: 11px; }
        .context-tag { font-size: 11px; color: var(--txt2); }
        .dec-opts { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
        .dec-opt { background: rgba(255,255,255,0.03); border: 1px solid rgba(201,150,59,0.15); color: var(--txt2); padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .dec-opt:hover { border-color: rgba(201,150,59,0.4); color: var(--txt1); }
        .dec-opt.selected { background: rgba(201,150,59,0.15); border-color: var(--gold); color: var(--gold); font-weight: 600; }
        .opt-revenue { font-size: 9px; color: #22c55e; margin-right: 4px; }
        .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0; padding: 10px; background: rgba(0,0,0,0.15); border-radius: 8px; }
        .pros-title { font-size: 10px; color: #22c55e; font-weight: 700; margin-bottom: 4px; }
        .cons-title { font-size: 10px; color: #ef4444; font-weight: 700; margin-bottom: 4px; }
        .pros-item, .cons-item { font-size: 11px; color: var(--txt2); }
        .dec-actions { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
        .btn-decide { background: rgba(201,150,59,0.08); border: 1px solid rgba(201,150,59,0.2); color: var(--txt3); padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.25s; }
        .btn-decide.ready { background: rgba(201,150,59,0.2); border-color: var(--gold); color: var(--gold); }
        .btn-decide.ready:hover { background: rgba(201,150,59,0.35); }
        .btn-decide:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-edit { background: transparent; border: 1px solid rgba(255,255,255,0.08); color: var(--txt2); padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn-edit:hover { border-color: rgba(255,255,255,0.2); color: var(--txt1); }
        .btn-archive { background: transparent; border: 1px solid rgba(100,100,120,0.2); color: var(--txt3); padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: inherit; margin-right: auto; transition: all 0.2s; }
        .btn-archive:hover { border-color: rgba(100,100,120,0.4); color: var(--txt2); }
        .section-sep { font-size: 12px; font-weight: 700; color: #22c55e; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(34,197,94,0.2); }
        .decided-card { background: rgba(255,255,255,0.01); border: 1px solid rgba(34,197,94,0.15); border-right: 3px solid #22c55e; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; opacity: 0.75; }
        .decided-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .decided-title { font-size: 12px; font-weight: 600; color: var(--txt1); }
        .chosen-badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(34,197,94,0.15); color: #22c55e; font-weight: 600; flex-shrink: 0; }
        .decided-date { font-size: 10px; color: var(--txt3); margin-top: 4px; }
        .decided-notes { font-size: 11px; color: var(--txt2); margin-top: 4px; }
        .btn-revisit { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--txt2); padding: 4px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn-revisit:hover { border-color: rgba(255,255,255,0.25); color: var(--txt1); }
        .btn-del-sm { background: transparent; border: 1px solid rgba(239,68,68,0.2); color: #ef4444; padding: 4px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; font-family: inherit; }
        .empty-state { text-align: center; padding: 48px 20px; }
        .empty-icon { font-size: 36px; margin-bottom: 12px; }
        .empty-title { font-size: 15px; font-weight: 700; color: var(--txt2); margin-bottom: 6px; }
        .empty-sub { font-size: 12px; color: var(--txt3); }
        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-box { background: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 14px; padding: 24px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .modal-title { font-size: 16px; font-weight: 800; color: #1D1D1F; margin: 0; }
        .modal-close { background: transparent; border: none; color: #6B7280; font-size: 16px; cursor: pointer; padding: 4px; }
        .field-label { display: block; font-size: 11px; color: #6B7280; margin-bottom: 5px; margin-top: 12px; font-weight: 600; }
        .field-input { width: 100%; background: #F9F9F9; border: 1px solid #E5E5E5; color: #1D1D1F; padding: 8px 10px; border-radius: 7px; font-size: 13px; font-family: inherit; box-sizing: border-box; }
        .field-input:focus { outline: none; border-color: var(--gold); }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        .btn-save { background: rgba(201,150,59,0.2); border: 1px solid var(--gold); color: var(--gold); padding: 8px 18px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn-save:hover { background: rgba(201,150,59,0.35); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-cancel { background: transparent; border: 1px solid #E5E5E5; color: #6B7280; padding: 8px 14px; border-radius: 7px; font-size: 12px; cursor: pointer; font-family: inherit; }
        .btn-danger-sm { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 8px 12px; border-radius: 7px; font-size: 12px; cursor: pointer; font-family: inherit; margin-left: auto; }
      `}</style>
    </div>
  );
}
