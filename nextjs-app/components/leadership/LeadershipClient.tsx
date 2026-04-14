'use client';

import { useState, useTransition } from 'react';
import {
  addDecision, updateDecision, deleteDecision,
  addEmployee, updateEmployee, deleteEmployee,
} from '@/lib/leadership-actions';
import type { DecisionRow, EmployeeRow } from '@/lib/leadership-types';
import {
  DECISION_STATUS_LABELS, DECISION_IMPACT_LABELS, EMPLOYEE_STATUS_LABELS,
} from '@/lib/leadership-types';

interface Props {
  decisions: DecisionRow[];
  employees: EmployeeRow[];
  brands: { id: string; name: string; icon: string }[];
}

type Tab = 'decisions' | 'employees';

// ─── Decision Form ─────────────────────────────────────────────────────────

interface DecisionFormData {
  title: string;
  brandId: string;
  impact: string;
  status: string;
  context: string;
  deadline: string;
  notes: string;
}

const emptyDecision: DecisionFormData = {
  title: '', brandId: '', impact: 'medium', status: 'open',
  context: '', deadline: '', notes: '',
};

// ─── Employee Form ─────────────────────────────────────────────────────────

interface EmployeeFormData {
  name: string;
  role: string;
  brandIds: string[];
  salaryType: string;
  salaryAmount: number;
  salaryUnit: string;
  status: string;
}

const emptyEmployee: EmployeeFormData = {
  name: '', role: '', brandIds: [], salaryType: 'fixed',
  salaryAmount: 0, salaryUnit: '', status: 'active',
};

// ─── Main Component ────────────────────────────────────────────────────────

export default function LeadershipClient({ decisions, employees, brands }: Props) {
  const [tab, setTab] = useState<Tab>('decisions');
  const [isPending, startTransition] = useTransition();

  // Decision state
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [editingDecision, setEditingDecision] = useState<DecisionRow | null>(null);
  const [decisionForm, setDecisionForm] = useState<DecisionFormData>(emptyDecision);

  // Employee state
  const [empFilter, setEmpFilter] = useState<string>('all');
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeRow | null>(null);
  const [empForm, setEmpForm] = useState<EmployeeFormData>(emptyEmployee);

  // ── Decision handlers ──────────────────────────────────────────────────

  const openAddDecision = () => {
    setEditingDecision(null);
    setDecisionForm(emptyDecision);
    setShowDecisionForm(true);
  };

  const openEditDecision = (d: DecisionRow) => {
    setEditingDecision(d);
    setDecisionForm({
      title: d.title,
      brandId: d.brand_id ?? '',
      impact: d.impact,
      status: d.status,
      context: d.context ?? '',
      deadline: d.deadline ?? '',
      notes: d.notes ?? '',
    });
    setShowDecisionForm(true);
  };

  const handleSaveDecision = () => {
    if (!decisionForm.title.trim()) return;
    startTransition(async () => {
      if (editingDecision) {
        await updateDecision(editingDecision.id, decisionForm);
      } else {
        await addDecision(decisionForm);
      }
      setShowDecisionForm(false);
    });
  };

  const handleDeleteDecision = (id: string) => {
    if (!window.confirm('حذف هذا القرار؟')) return;
    startTransition(async () => {
      await deleteDecision(id);
    });
  };

  // ── Employee handlers ──────────────────────────────────────────────────

  const openAddEmployee = () => {
    setEditingEmp(null);
    setEmpForm(emptyEmployee);
    setShowEmpForm(true);
  };

  const openEditEmployee = (e: EmployeeRow) => {
    setEditingEmp(e);
    setEmpForm({
      name: e.name,
      role: e.role,
      brandIds: e.brand_ids,
      salaryType: e.salary_type,
      salaryAmount: e.salary_amount,
      salaryUnit: e.salary_unit ?? '',
      status: e.status,
    });
    setShowEmpForm(true);
  };

  const handleSaveEmployee = () => {
    if (!empForm.name.trim()) return;
    startTransition(async () => {
      if (editingEmp) {
        await updateEmployee(editingEmp.id, empForm);
      } else {
        await addEmployee(empForm);
      }
      setShowEmpForm(false);
    });
  };

  const handleDeleteEmployee = (id: string) => {
    if (!window.confirm('حذف هذا الموظف؟')) return;
    startTransition(async () => {
      await deleteEmployee(id);
    });
  };

  // ── Filtered data ──────────────────────────────────────────────────────

  const filteredDecisions = decisionFilter === 'all'
    ? decisions
    : decisions.filter(d => d.status === decisionFilter);

  const filteredEmployees = empFilter === 'all'
    ? employees
    : employees.filter(e => e.status === empFilter);

  // ── Brand lookup ───────────────────────────────────────────────────────

  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]));

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">القيادة</h1>
        <span className="text-sm text-gray-400">
          {decisions.length} قرار · {employees.length} موظف
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setTab('decisions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'decisions'
              ? 'border-yellow-400 text-yellow-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          ⚖️ القرارات ({decisions.length})
        </button>
        <button
          onClick={() => setTab('employees')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'employees'
              ? 'border-yellow-400 text-yellow-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          👥 الفريق ({employees.length})
        </button>
      </div>

      {/* ── DECISIONS TAB ─────────────────────────────────────────────────── */}
      {tab === 'decisions' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'open', 'decided', 'archived'].map(s => (
                <button
                  key={s}
                  onClick={() => setDecisionFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    decisionFilter === s
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {s === 'all' ? `الكل (${decisions.length})` : `${DECISION_STATUS_LABELS[s]} (${decisions.filter(d => d.status === s).length})`}
                </button>
              ))}
            </div>
            <button
              onClick={openAddDecision}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors"
            >
              + قرار جديد
            </button>
          </div>

          {/* Decision Form */}
          {showDecisionForm && (
            <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-600">
              <h3 className="font-bold mb-4 text-yellow-400">
                {editingDecision ? '✏ تعديل القرار' : '+ قرار جديد'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">عنوان القرار *</label>
                  <input
                    type="text"
                    placeholder="عنوان القرار"
                    value={decisionForm.title}
                    onChange={e => setDecisionForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">البراند</label>
                  <select
                    value={decisionForm.brandId}
                    onChange={e => setDecisionForm(p => ({ ...p, brandId: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  >
                    <option value="">— بدون براند —</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الحالة</label>
                  <select
                    value={decisionForm.status}
                    onChange={e => setDecisionForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  >
                    <option value="open">مفتوح</option>
                    <option value="decided">تم القرار</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الأثر</label>
                  <select
                    value={decisionForm.impact}
                    onChange={e => setDecisionForm(p => ({ ...p, impact: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">مرتفع</option>
                    <option value="critical">حرج</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الموعد النهائي</label>
                  <input
                    type="date"
                    value={decisionForm.deadline}
                    onChange={e => setDecisionForm(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">السياق</label>
                  <textarea
                    placeholder="وصف القرار والسياق..."
                    value={decisionForm.context}
                    onChange={e => setDecisionForm(p => ({ ...p, context: e.target.value }))}
                    rows={2}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">ملاحظات</label>
                  <textarea
                    placeholder="ملاحظات إضافية..."
                    value={decisionForm.notes}
                    onChange={e => setDecisionForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveDecision}
                  disabled={isPending || !decisionForm.title.trim()}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'جاري الحفظ...' : '+ أضف'}
                </button>
                <button
                  onClick={() => setShowDecisionForm(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Decisions List */}
          <div className="space-y-3">
            {filteredDecisions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد قرارات</p>
            ) : (
              filteredDecisions.map(d => {
                const brand = d.brand_id ? brandMap[d.brand_id] : null;
                const impactColors: Record<string, string> = {
                  low: 'text-green-400', medium: 'text-yellow-400',
                  high: 'text-orange-400', critical: 'text-red-400',
                };
                const statusColors: Record<string, string> = {
                  open: 'bg-blue-900 text-blue-300',
                  decided: 'bg-green-900 text-green-300',
                  archived: 'bg-gray-700 text-gray-400',
                };
                return (
                  <div key={d.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-white">{d.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[d.status] ?? 'bg-gray-700 text-gray-400'}`}>
                            {DECISION_STATUS_LABELS[d.status] ?? d.status}
                          </span>
                          <span className={`text-xs font-medium ${impactColors[d.impact] ?? 'text-gray-400'}`}>
                            ● {DECISION_IMPACT_LABELS[d.impact] ?? d.impact}
                          </span>
                        </div>
                        {brand && (
                          <span className="text-xs text-gray-400">{brand.icon} {brand.name}</span>
                        )}
                        {d.context && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{d.context}</p>
                        )}
                        {d.deadline && (
                          <p className="text-xs text-gray-500 mt-1">⏰ {d.deadline}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => openEditDecision(d)}
                          className="text-xs px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          ✏ تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteDecision(d.id)}
                          className="text-xs px-3 py-1.5 bg-red-900 text-red-300 rounded-lg hover:bg-red-800 transition-colors"
                        >
                          🗑 حذف
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── EMPLOYEES TAB ─────────────────────────────────────────────────── */}
      {tab === 'employees' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'inactive', 'on_leave'].map(s => (
                <button
                  key={s}
                  onClick={() => setEmpFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    empFilter === s
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {s === 'all' ? `الكل (${employees.length})` : `${EMPLOYEE_STATUS_LABELS[s]} (${employees.filter(e => e.status === s).length})`}
                </button>
              ))}
            </div>
            <button
              onClick={openAddEmployee}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors"
            >
              + موظف جديد
            </button>
          </div>

          {/* Employee Form */}
          {showEmpForm && (
            <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-600">
              <h3 className="font-bold mb-4 text-yellow-400">
                {editingEmp ? '✏ تعديل الموظف' : '+ موظف جديد'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الاسم *</label>
                  <input
                    type="text"
                    placeholder="اسم الموظف"
                    value={empForm.name}
                    onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الدور</label>
                  <input
                    type="text"
                    placeholder="مدير تسويق، محاسب..."
                    value={empForm.role}
                    onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">نوع الراتب</label>
                  <select
                    value={empForm.salaryType}
                    onChange={e => setEmpForm(p => ({ ...p, salaryType: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  >
                    <option value="fixed">ثابت</option>
                    <option value="per_unit">لكل وحدة</option>
                    <option value="commission">عمولة</option>
                    <option value="volunteer">متطوع</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">المبلغ</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={empForm.salaryAmount}
                    onChange={e => setEmpForm(p => ({ ...p, salaryAmount: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الوحدة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="ريال/عطر، %..."
                    value={empForm.salaryUnit}
                    onChange={e => setEmpForm(p => ({ ...p, salaryUnit: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الحالة</label>
                  <select
                    value={empForm.status}
                    onChange={e => setEmpForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="on_leave">إجازة</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveEmployee}
                  disabled={isPending || !empForm.name.trim()}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 disabled:opacity-50 transition-colors"
                >
                  {isPending ? 'جاري الحفظ...' : '+ أضف'}
                </button>
                <button
                  onClick={() => setShowEmpForm(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmployees.length === 0 ? (
              <p className="text-gray-500 text-center py-8 col-span-2">لا يوجد موظفون</p>
            ) : (
              filteredEmployees.map(e => {
                const statusColors: Record<string, string> = {
                  active: 'bg-green-900 text-green-300',
                  inactive: 'bg-gray-700 text-gray-400',
                  on_leave: 'bg-yellow-900 text-yellow-300',
                };
                const empBrands = e.brand_ids
                  .map(bid => brandMap[bid])
                  .filter(Boolean);
                return (
                  <div key={e.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{e.name}</h3>
                        <p className="text-xs text-gray-400">{e.role}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[e.status] ?? 'bg-gray-700 text-gray-400'}`}>
                        {EMPLOYEE_STATUS_LABELS[e.status] ?? e.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {empBrands.map(b => (
                        <span key={b.id} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                          {b.icon} {b.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 mb-3">
                      💰 {e.salary_amount.toLocaleString('ar-SA')} {e.salary_unit ?? 'ريال'}
                      {e.salary_type !== 'fixed' && ` (${e.salary_type === 'per_unit' ? 'لكل وحدة' : e.salary_type === 'commission' ? 'عمولة' : 'متطوع'})`}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditEmployee(e)}
                        className="text-xs px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        ✏ تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(e.id)}
                        className="text-xs px-3 py-1.5 bg-red-900 text-red-300 rounded-lg hover:bg-red-800 transition-colors"
                      >
                        🗑 حذف
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
