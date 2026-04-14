'use client';

import { useState } from 'react';
import type { ExpenseSection, MonthlyGoal } from '@/lib/accounts-types';
import { MONTH_NAMES } from '@/lib/accounts-types';
import {
  updateExpenseSection,
  addExpenseSection,
  deleteExpenseSection,
  addMonthlyGoal,
  updateMonthlyGoal,
  deleteMonthlyGoal,
} from '@/lib/accounts-actions';

interface Props {
  expenses: ExpenseSection[];
  goals: MonthlyGoal[];
}

export default function AccountsClient({ expenses: initExpenses, goals: initGoals }: Props) {
  const [expenses, setExpenses] = useState<ExpenseSection[]>(initExpenses);
  const [goals, setGoals] = useState<MonthlyGoal[]>(initGoals);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals'>('overview');

  // ─── Add Section ────────────────────────────────────────────────────────────
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ title: '', type: 'other', color: 'var(--acc1)' });

  const handleAddSection = async () => {
    if (!newSection.title.trim()) return;
    const sec = await addExpenseSection(newSection);
    setExpenses(prev => [sec, ...prev]);
    setNewSection({ title: '', type: 'other', color: 'var(--acc1)' });
    setShowAddSection(false);
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('حذف هذا القسم؟')) return;
    await deleteExpenseSection(id);
    setExpenses(prev => prev.filter(s => s.id !== id));
  };

  // ─── Edit Section Title ──────────────────────────────────────────────────────
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleEditSection = async (sec: ExpenseSection) => {
    if (!editTitle.trim()) return;
    await updateExpenseSection(sec.id, { title: editTitle });
    setExpenses(prev => prev.map(s => s.id === sec.id ? { ...s, title: editTitle } : s));
    setEditingSection(null);
  };

  // ─── Goals ──────────────────────────────────────────────────────────────────
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    revenueTarget: 0,
    ordersTarget: 0,
    newCustomersTarget: 0,
    notes: '',
  });

  const handleAddGoal = async () => {
    const g = await addMonthlyGoal(newGoal);
    setGoals(prev => [g, ...prev]);
    setNewGoal({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, revenueTarget: 0, ordersTarget: 0, newCustomersTarget: 0, notes: '' });
    setShowAddGoal(false);
  };

  const [editingGoal, setEditingGoal] = useState<MonthlyGoal | null>(null);
  const [editGoal, setEditGoal] = useState({ revenueTarget: 0, ordersTarget: 0, newCustomersTarget: 0, notes: '' });

  const handleEditGoal = async () => {
    if (!editingGoal) return;
    await updateMonthlyGoal(editingGoal.id, editGoal);
    setGoals(prev => prev.map(g => g.id === editingGoal.id ? {
      ...g,
      revenue_target: editGoal.revenueTarget,
      orders_target: editGoal.ordersTarget,
      new_customers_target: editGoal.newCustomersTarget,
      notes: editGoal.notes,
    } : g));
    setEditingGoal(null);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('حذف هذا الهدف؟')) return;
    await deleteMonthlyGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // ─── Calculations ────────────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((sum, sec) =>
    sum + sec.items.reduce((s, item) => s + item.amount, 0), 0
  );
  const sectionTotals = expenses.map(sec => ({
    ...sec,
    total: sec.items.reduce((s, item) => s + item.amount, 0),
  }));

  return (
    <div className="p-6 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الحسابات والمالية</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            نظرة عامة
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'goals' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            الأهداف الشهرية
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">إجمالي المصاريف الشهرية</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{totalExpenses.toLocaleString()} ر.س</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">عدد أقسام المصاريف</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{expenses.length}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">إجمالي البنود</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{expenses.reduce((s, sec) => s + sec.items.length, 0)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">أهداف مسجّلة</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{goals.length}</p>
            </div>
          </div>

          {/* Expense Sections */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">أقسام المصاريف</h2>
            <button
              onClick={() => setShowAddSection(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + قسم جديد
            </button>
          </div>

          {showAddSection && (
            <div className="bg-gray-800 rounded-xl p-4 border border-blue-500 space-y-3">
              <h3 className="font-medium text-blue-400">إضافة قسم جديد</h3>
              <input
                value={newSection.title}
                onChange={e => setNewSection(p => ({ ...p, title: e.target.value }))}
                placeholder="اسم القسم"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={newSection.type}
                onChange={e => setNewSection(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value="living">معيشة</option>
                <option value="business">أعمال</option>
                <option value="debt">ديون</option>
                <option value="salaries">رواتب</option>
                <option value="utilities">مرافق</option>
                <option value="family">أسرة</option>
                <option value="other">أخرى</option>
              </select>
              <div className="flex gap-2">
                <button onClick={handleAddSection} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">+ أضف</button>
                <button onClick={() => setShowAddSection(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">إلغاء</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionTotals.map(sec => (
              <div key={sec.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  {editingSection === sec.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                      <button onClick={() => handleEditSection(sec)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">✓</button>
                      <button onClick={() => setEditingSection(null)} className="px-2 py-1 bg-gray-600 text-white rounded text-xs">✕</button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold">{sec.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-400">{sec.total.toLocaleString()} ر.س</span>
                        <button
                          onClick={() => { setEditingSection(sec.id); setEditTitle(sec.title); }}
                          className="text-gray-400 hover:text-blue-400 text-sm"
                        >✏</button>
                        <button
                          onClick={() => handleDeleteSection(sec.id)}
                          className="text-gray-400 hover:text-red-400 text-sm"
                        >🗑</button>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  {sec.items.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.name}{item.note ? ` (${item.note})` : ''}</span>
                      <span className="text-gray-300">{item.amount.toLocaleString()} ر.س</span>
                    </div>
                  ))}
                  {sec.items.length > 5 && (
                    <p className="text-gray-500 text-xs mt-1">+ {sec.items.length - 5} بنود أخرى</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'goals' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">الأهداف الشهرية</h2>
            <button
              onClick={() => setShowAddGoal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + هدف جديد
            </button>
          </div>

          {showAddGoal && (
            <div className="bg-gray-800 rounded-xl p-4 border border-blue-500 space-y-3">
              <h3 className="font-medium text-blue-400">إضافة هدف شهري</h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newGoal.year}
                  onChange={e => setNewGoal(p => ({ ...p, year: Number(e.target.value) }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                >
                  {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={newGoal.month}
                  onChange={e => setNewGoal(p => ({ ...p, month: Number(e.target.value) }))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.entries(MONTH_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input
                  type="number"
                  value={newGoal.revenueTarget}
                  onChange={e => setNewGoal(p => ({ ...p, revenueTarget: Number(e.target.value) }))}
                  placeholder="هدف الإيرادات (ر.س)"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={newGoal.ordersTarget}
                  onChange={e => setNewGoal(p => ({ ...p, ordersTarget: Number(e.target.value) }))}
                  placeholder="هدف الطلبات"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={newGoal.newCustomersTarget}
                  onChange={e => setNewGoal(p => ({ ...p, newCustomersTarget: Number(e.target.value) }))}
                  placeholder="هدف العملاء الجدد"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  value={newGoal.notes}
                  onChange={e => setNewGoal(p => ({ ...p, notes: e.target.value }))}
                  placeholder="ملاحظات"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddGoal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">+ أضف</button>
                <button onClick={() => setShowAddGoal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">إلغاء</button>
              </div>
            </div>
          )}

          {editingGoal && (
            <div className="bg-gray-800 rounded-xl p-4 border border-yellow-500 space-y-3">
              <h3 className="font-medium text-yellow-400">تعديل هدف {MONTH_NAMES[editingGoal.month]} {editingGoal.year}</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={editGoal.revenueTarget}
                  onChange={e => setEditGoal(p => ({ ...p, revenueTarget: Number(e.target.value) }))}
                  placeholder="هدف الإيرادات"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={editGoal.ordersTarget}
                  onChange={e => setEditGoal(p => ({ ...p, ordersTarget: Number(e.target.value) }))}
                  placeholder="هدف الطلبات"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={editGoal.newCustomersTarget}
                  onChange={e => setEditGoal(p => ({ ...p, newCustomersTarget: Number(e.target.value) }))}
                  placeholder="هدف العملاء الجدد"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  value={editGoal.notes}
                  onChange={e => setEditGoal(p => ({ ...p, notes: e.target.value }))}
                  placeholder="ملاحظات"
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleEditGoal} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm">حفظ</button>
                <button onClick={() => setEditingGoal(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">إلغاء</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {goals.map(g => (
              <div key={g.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{MONTH_NAMES[g.month]} {g.year}</h3>
                    {g.notes && <p className="text-gray-400 text-sm mt-1">{g.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">الإيرادات</p>
                      <p className="font-bold text-green-400">{g.revenue_target.toLocaleString()} ر.س</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">الطلبات</p>
                      <p className="font-bold text-blue-400">{g.orders_target}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">عملاء جدد</p>
                      <p className="font-bold text-yellow-400">{g.new_customers_target}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(g);
                          setEditGoal({
                            revenueTarget: g.revenue_target,
                            ordersTarget: g.orders_target,
                            newCustomersTarget: g.new_customers_target,
                            notes: g.notes ?? '',
                          });
                        }}
                        className="p-1 text-gray-400 hover:text-blue-400"
                      >✏</button>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                      >🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
