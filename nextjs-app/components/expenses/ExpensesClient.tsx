'use client';

import { useState } from 'react';
import type { ExpenseSection, ExpenseItem } from '@/lib/expenses-types';
import { EXPENSE_TYPE_LABELS } from '@/lib/expenses-types';
import {
  addExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
} from '@/lib/expenses-actions';

interface Props {
  sections: ExpenseSection[];
}

export default function ExpensesClient({ sections: initSections }: Props) {
  const [sections, setSections] = useState<ExpenseSection[]>(initSections);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    initSections[0]?.id ?? null
  );

  // ─── Add Item ────────────────────────────────────────────────────────────────
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{ name: string; amount: string; kind: 'fixed' | 'variable'; note: string }>({
    name: '', amount: '', kind: 'fixed', note: '',
  });

  const handleAddItem = async (sectionId: string) => {
    if (!newItem.name.trim() || !newItem.amount) return;
    const sec = sections.find(s => s.id === sectionId);
    if (!sec) return;
    const updated = await addExpenseItem(sectionId, sec.items, {
      kind: newItem.kind,
      name: newItem.name,
      amount: Number(newItem.amount),
      note: newItem.note || undefined,
    });
    setSections(prev => prev.map(s => s.id === sectionId ? updated : s));
    setNewItem({ name: '', amount: '', kind: 'fixed', note: '' });
    setAddingTo(null);
  };

  // ─── Edit Item ───────────────────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<{ sectionId: string; itemId: string } | null>(null);
  const [editItem, setEditItem] = useState<{ name: string; amount: string; kind: 'fixed' | 'variable'; note: string }>({
    name: '', amount: '', kind: 'fixed', note: '',
  });

  const handleEditItem = async () => {
    if (!editingItem) return;
    const sec = sections.find(s => s.id === editingItem.sectionId);
    if (!sec) return;
    const updated = await updateExpenseItem(
      editingItem.sectionId,
      sec.items,
      editingItem.itemId,
      {
        name: editItem.name,
        amount: Number(editItem.amount),
        kind: editItem.kind,
        note: editItem.note || undefined,
      }
    );
    setSections(prev => prev.map(s => s.id === editingItem.sectionId ? updated : s));
    setEditingItem(null);
  };

  // ─── Delete Item ─────────────────────────────────────────────────────────────
  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    if (!window.confirm('حذف هذا البند؟')) return;
    const sec = sections.find(s => s.id === sectionId);
    if (!sec) return;
    const updated = await deleteExpenseItem(sectionId, sec.items, itemId);
    setSections(prev => prev.map(s => s.id === sectionId ? updated : s));
  };

  // ─── Totals ──────────────────────────────────────────────────────────────────
  const grandTotal = sections.reduce((sum, sec) =>
    sum + sec.items.reduce((s, item) => s + item.amount, 0), 0
  );

  return (
    <div className="p-6 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المصاريف</h1>
        <div className="bg-gray-800 rounded-xl px-4 py-2 border border-gray-700">
          <span className="text-gray-400 text-sm">الإجمالي الشهري: </span>
          <span className="text-red-400 font-bold text-lg">{grandTotal.toLocaleString()} ر.س</span>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sections.map(sec => {
          const total = sec.items.reduce((s, item) => s + item.amount, 0);
          const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
          return (
            <button
              key={sec.id}
              onClick={() => setExpandedSection(expandedSection === sec.id ? null : sec.id)}
              className={`bg-gray-800 rounded-xl p-3 border text-right transition-colors ${expandedSection === sec.id ? 'border-blue-500' : 'border-gray-700 hover:border-gray-500'}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-400">{EXPENSE_TYPE_LABELS[sec.type] ?? sec.type}</span>
                <span className="text-xs text-gray-500">{pct}%</span>
              </div>
              <p className="font-semibold text-sm mt-1">{sec.title}</p>
              <p className="text-red-400 font-bold">{total.toLocaleString()} ر.س</p>
              <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Section Detail */}
      {sections.map(sec => {
        if (expandedSection !== sec.id) return null;
        const sectionTotal = sec.items.reduce((s, item) => s + item.amount, 0);
        return (
          <div key={sec.id} className="bg-gray-800 rounded-xl border border-blue-500 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="font-semibold text-lg">{sec.title}</h2>
              <div className="flex items-center gap-3">
                <span className="text-red-400 font-bold">{sectionTotal.toLocaleString()} ر.س</span>
                <button
                  onClick={() => setAddingTo(sec.id)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  + بند جديد
                </button>
              </div>
            </div>

            {addingTo === sec.id && (
              <div className="p-4 bg-gray-750 border-b border-gray-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={newItem.name}
                    onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                    placeholder="اسم البند"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={newItem.amount}
                    onChange={e => setNewItem(p => ({ ...p, amount: e.target.value }))}
                    placeholder="المبلغ (ر.س)"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  />
                  <select
                    value={newItem.kind}
                    onChange={e => setNewItem(p => ({ ...p, kind: e.target.value as 'fixed' | 'variable' }))}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="fixed">ثابت</option>
                    <option value="variable">متغير</option>
                  </select>
                  <input
                    value={newItem.note}
                    onChange={e => setNewItem(p => ({ ...p, note: e.target.value }))}
                    placeholder="ملاحظة (اختياري)"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAddItem(sec.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">+ أضف</button>
                  <button onClick={() => setAddingTo(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">إلغاء</button>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-700">
              {sec.items.map(item => (
                <div key={item.id} className="p-4">
                  {editingItem?.sectionId === sec.id && editingItem?.itemId === item.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={editItem.name}
                          onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          value={editItem.amount}
                          onChange={e => setEditItem(p => ({ ...p, amount: e.target.value }))}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                        />
                        <select
                          value={editItem.kind}
                          onChange={e => setEditItem(p => ({ ...p, kind: e.target.value as 'fixed' | 'variable' }))}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="fixed">ثابت</option>
                          <option value="variable">متغير</option>
                        </select>
                        <input
                          value={editItem.note}
                          onChange={e => setEditItem(p => ({ ...p, note: e.target.value }))}
                          placeholder="ملاحظة"
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleEditItem} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">حفظ</button>
                        <button onClick={() => setEditingItem(null)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm">إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.kind === 'fixed' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                          {item.kind === 'fixed' ? 'ثابت' : 'متغير'}
                        </span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.note && <p className="text-gray-400 text-xs">{item.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-400">{item.amount.toLocaleString()} ر.س</span>
                        <button
                          onClick={() => {
                            setEditingItem({ sectionId: sec.id, itemId: item.id });
                            setEditItem({ name: item.name, amount: String(item.amount), kind: item.kind, note: item.note ?? '' });
                          }}
                          className="text-gray-400 hover:text-blue-400 text-sm"
                        >✏</button>
                        <button
                          onClick={() => handleDeleteItem(sec.id, item.id)}
                          className="text-gray-400 hover:text-red-400 text-sm"
                        >🗑</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {sec.items.length === 0 && (
                <div className="p-8 text-center text-gray-500">لا توجد بنود — أضف بنداً جديداً</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
