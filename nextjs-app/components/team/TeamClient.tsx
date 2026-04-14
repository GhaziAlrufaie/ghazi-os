'use client';

import { useState } from 'react';
import type { Employee } from '@/lib/team-types';
import { SALARY_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/team-types';
import { addEmployee, updateEmployee, deleteEmployee } from '@/lib/team-actions';

interface Props {
  employees: Employee[];
  brands: { id: string; name: string }[];
}

const emptyForm = {
  name: '',
  role: '',
  brandIds: [] as string[],
  salaryType: 'fixed' as 'fixed' | 'per_unit' | 'freelance',
  salaryAmount: 0,
  salaryUnit: '',
  reportsTo: '',
  status: 'active' as 'active' | 'inactive' | 'freelance',
};

export default function TeamClient({ employees: initEmployees, brands }: Props) {
  const [employees, setEmployees] = useState<Employee[]>(initEmployees);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ─── Add ─────────────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.role.trim()) return;
    const emp = await addEmployee({
      name: form.name,
      role: form.role,
      brandIds: form.brandIds,
      salaryType: form.salaryType,
      salaryAmount: form.salaryAmount,
      salaryUnit: form.salaryUnit || undefined,
      reportsTo: form.reportsTo || undefined,
      status: form.status,
    });
    setEmployees(prev => [...prev, emp]);
    setForm({ ...emptyForm });
    setShowAdd(false);
  };

  // ─── Edit ────────────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditForm({
      name: emp.name,
      role: emp.role,
      brandIds: emp.brand_ids,
      salaryType: emp.salary_type,
      salaryAmount: emp.salary_amount,
      salaryUnit: emp.salary_unit ?? '',
      reportsTo: emp.reports_to ?? '',
      status: emp.status,
    });
  };

  const handleEdit = async () => {
    if (!editingId) return;
    await updateEmployee(editingId, {
      name: editForm.name,
      role: editForm.role,
      brandIds: editForm.brandIds,
      salaryType: editForm.salaryType,
      salaryAmount: editForm.salaryAmount,
      salaryUnit: editForm.salaryUnit || null,
      reportsTo: editForm.reportsTo || null,
      status: editForm.status,
    });
    setEmployees(prev => prev.map(e =>
      e.id === editingId ? {
        ...e,
        name: editForm.name,
        role: editForm.role,
        brand_ids: editForm.brandIds,
        salary_type: editForm.salaryType,
        salary_amount: editForm.salaryAmount,
        salary_unit: editForm.salaryUnit || null,
        reports_to: editForm.reportsTo || null,
        status: editForm.status,
        updated_at: new Date().toISOString(),
      } : e
    ));
    setEditingId(null);
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف هذا الموظف؟')) return;
    await deleteEmployee(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getEmployeeName = (id: string | null) =>
    id ? employees.find(e => e.id === id)?.name ?? id : '—';

  const getBrandName = (id: string) =>
    brands.find(b => b.id === id)?.name ?? id;

  const filtered = filterStatus === 'all'
    ? employees
    : employees.filter(e => e.status === filterStatus);

  const totalSalary = employees
    .filter(e => e.salary_type === 'fixed' && e.status !== 'inactive')
    .reduce((s, e) => s + e.salary_amount, 0);

  // ─── Form Component ──────────────────────────────────────────────────────────
  const EmployeeForm = ({
    f,
    setF,
    onSave,
    onCancel,
    saveLabel,
  }: {
    f: typeof emptyForm;
    setF: (v: typeof emptyForm) => void;
    onSave: () => void;
    onCancel: () => void;
    saveLabel: string;
  }) => (
    <div className="bg-gray-800 rounded-xl p-4 border border-blue-500 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          value={f.name}
          onChange={e => setF({ ...f, name: e.target.value })}
          placeholder="الاسم"
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={f.role}
          onChange={e => setF({ ...f, role: e.target.value })}
          placeholder="المنصب / الدور"
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={f.salaryType}
          onChange={e => setF({ ...f, salaryType: e.target.value as typeof f.salaryType })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="fixed">راتب ثابت</option>
          <option value="per_unit">بالقطعة</option>
          <option value="freelance">فريلانسر</option>
        </select>
        <input
          type="number"
          value={f.salaryAmount}
          onChange={e => setF({ ...f, salaryAmount: Number(e.target.value) })}
          placeholder="المبلغ"
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        />
        {f.salaryType === 'per_unit' && (
          <input
            value={f.salaryUnit}
            onChange={e => setF({ ...f, salaryUnit: e.target.value })}
            placeholder="الوحدة (مثل: ريال/عطر)"
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
          />
        )}
        <select
          value={f.status}
          onChange={e => setF({ ...f, status: e.target.value as typeof f.status })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="freelance">فريلانسر</option>
        </select>
        <select
          value={f.reportsTo}
          onChange={e => setF({ ...f, reportsTo: e.target.value })}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">يرفع لـ (اختياري)</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="text-sm text-gray-400 mb-2">البراندات المرتبطة:</p>
        <div className="flex flex-wrap gap-2">
          {brands.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setF({
                ...f,
                brandIds: f.brandIds.includes(b.id)
                  ? f.brandIds.filter(id => id !== b.id)
                  : [...f.brandIds, b.id],
              })}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${f.brandIds.includes(b.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">{saveLabel}</button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">إلغاء</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الفريق</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + موظف جديد
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">إجمالي الفريق</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{employees.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">نشطون</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{employees.filter(e => e.status === 'active').length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">فريلانسر</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{employees.filter(e => e.status === 'freelance').length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">رواتب ثابتة شهرياً</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{totalSalary.toLocaleString()} ر.س</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'active', 'inactive', 'freelance'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            {s === 'all' ? 'الكل' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <EmployeeForm
          f={form}
          setF={setForm}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saveLabel="+ أضف"
        />
      )}

      {/* Edit Form */}
      {editingId && (
        <EmployeeForm
          f={editForm}
          setF={setEditForm}
          onSave={handleEdit}
          onCancel={() => setEditingId(null)}
          saveLabel="حفظ التعديل"
        />
      )}

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{emp.name}</h3>
                <p className="text-gray-400 text-sm">{emp.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[emp.status]}`}>
                  {STATUS_LABELS[emp.status]}
                </span>
                <button onClick={() => startEdit(emp)} className="text-gray-400 hover:text-blue-400 text-sm">✏</button>
                <button onClick={() => handleDelete(emp.id)} className="text-gray-400 hover:text-red-400 text-sm">🗑</button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">الراتب</span>
                <span className="font-medium">
                  {emp.salary_type === 'freelance'
                    ? 'فريلانسر'
                    : emp.salary_type === 'per_unit'
                    ? `${emp.salary_amount} ${emp.salary_unit ?? ''}`
                    : `${emp.salary_amount.toLocaleString()} ر.س / شهر`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">نوع الراتب</span>
                <span>{SALARY_TYPE_LABELS[emp.salary_type]}</span>
              </div>
              {emp.reports_to && (
                <div className="flex justify-between">
                  <span className="text-gray-400">يرفع لـ</span>
                  <span>{getEmployeeName(emp.reports_to)}</span>
                </div>
              )}
              {emp.brand_ids.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-400">البراندات</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {emp.brand_ids.map(bid => (
                      <span key={bid} className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">{getBrandName(bid)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">لا يوجد موظفون في هذه الفئة</div>
      )}
    </div>
  );
}
