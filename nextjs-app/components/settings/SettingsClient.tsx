'use client';
// SettingsClient — صفحة الإعدادات
// Layout: .scr.on wrapper — نفس /brands و /calendar
// 5 أقسام: واتساب | الفريق | البراندات | التفضيلات | البيانات
import { useState, useTransition, useCallback, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import {
  updateWhatsappSettings, addTeamContact, deleteTeamContact,
  addDailyMessage, toggleDailyMessage, deleteDailyMessage,
} from '@/lib/settings-actions';
import { addBrand, updateBrand } from '@/lib/brands-actions';
import { addEmployee, updateEmployee } from '@/lib/team-actions';
import type { WhatsappSettings, TeamContact, DailyMessage } from '@/lib/settings-actions';
import type { BrandRow } from '@/lib/brands-types';
import type { Employee } from '@/lib/team-types';

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--gold)' : 'var(--brd)',
        position: 'relative', transition: 'background .2s', flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', left: checked ? 23 : 3, boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 14,
      overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20,
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--brd)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Row Item ──────────────────────────────────────────────────────────────────
function RowItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid var(--brd)',
    }}>
      {children}
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 240, background: 'var(--gold)', color: '#fff',
      padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 9999, animation: 'fi .2s ease',
    }}>
      {msg}
      <button onClick={onClose} style={{ marginRight: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  whatsapp: WhatsappSettings | null;
  contacts: TeamContact[];
  messages: DailyMessage[];
  employees: Employee[];
  brands: BrandRow[];
}

// ─── Brand Modal ───────────────────────────────────────────────────────────────
function BrandModal({ editBrand, onClose, onSave }: {
  editBrand?: BrandRow | null;
  onClose: () => void;
  onSave: (b: BrandRow, isEdit: boolean) => void;
}) {
  const isEdit = !!editBrand;
  const [name,        setName]        = useState(editBrand?.name ?? '');
  const [nameEn,      setNameEn]      = useState(editBrand?.nameEn ?? '');
  const [icon,        setIcon]        = useState(editBrand?.icon ?? '🏷');
  const [color,       setColor]       = useState(editBrand?.color ?? '#C9A84C');
  const [status,      setStatus]      = useState<BrandRow['status']>(editBrand?.status ?? 'active');
  const [description, setDescription] = useState(editBrand?.description ?? '');
  const [productionDays, setProductionDays] = useState(String(editBrand?.productionDays ?? 7));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { setError('أدخل اسم البراند'); return; }
    setLoading(true); setError('');
    const input = { name, nameEn, icon, color, status, description, productionDays: Number(productionDays) || 7 };
    try {
      if (isEdit && editBrand) {
        const res = await updateBrand({ ...input, id: editBrand.id });
        if (res.error) throw new Error(res.error);
        onSave(res.brand!, true);
      } else {
        const res = await addBrand(input);
        if (res.error) throw new Error(res.error);
        onSave(res.brand!, false);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid var(--brd)',
    borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 };

  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', marginBottom: 20 }}>
          {isEdit ? 'تعديل البراند' : '+ براند جديد'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>الاسم العربي *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: بشرى" />
            </div>
            <div>
              <label style={labelStyle}>الاسم الإنجليزي</label>
              <input style={inputStyle} value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="bushra" dir="ltr" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>الأيقونة</label>
              <input style={inputStyle} value={icon} onChange={e => setIcon(e.target.value)} placeholder="🏷" />
            </div>
            <div>
              <label style={labelStyle}>اللون</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: '100%', height: 38, padding: '2px', border: '1px solid var(--brd)', borderRadius: 8, cursor: 'pointer', background: 'var(--bg)' }} />
            </div>
            <div>
              <label style={labelStyle}>الحالة</label>
              <select value={status} onChange={e => setStatus(e.target.value as BrandRow['status'])} style={inputStyle}>
                <option value="active">نشط</option>
                <option value="paused">متوقف</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>الوصف</label>
            <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف قصير للبراند" />
          </div>
          <div>
            <label style={labelStyle}>أيام الإنتاج</label>
            <input type="number" min="1" style={{ ...inputStyle, width: 120 }} value={productionDays} onChange={e => setProductionDays(e.target.value)} />
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--bg2)', border: '1px solid var(--brd)', color: 'var(--txt3)', cursor: 'pointer' }}>
              إلغاء
            </button>
            <button type="submit" className="btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : isEdit ? 'حفظ' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Employee Add Modal (للإضافة فقط) ─────────────────────────────────────────
function EmployeeAddModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (e: Employee) => void;
}) {
  const [name,         setName]         = useState('');
  const [role,         setRole]         = useState('');
  const [salaryType,   setSalaryType]   = useState<Employee['salary_type']>('fixed');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [status,       setStatus]       = useState<Employee['status']>('active');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !role) { setError('أدخل الاسم والوظيفة'); return; }
    setLoading(true); setError('');
    try {
      const newEmp = await addEmployee({
        name, role, brandIds: [], salaryType, salaryAmount: Number(salaryAmount) || 0, status,
      });
      onSave(newEmp);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid var(--brd)',
    borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 };

  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', marginBottom: 20 }}>+ موظف جديد</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>الاسم *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل" />
            </div>
            <div>
              <label style={labelStyle}>الوظيفة *</label>
              <input style={inputStyle} value={role} onChange={e => setRole(e.target.value)} placeholder="المسمى الوظيفي" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>نوع الراتب</label>
              <select value={salaryType} onChange={e => setSalaryType(e.target.value as Employee['salary_type'])} style={inputStyle}>
                <option value="fixed">راتب ثابت</option>
                <option value="per_unit">بالقطعة</option>
                <option value="freelance">فريلانسر</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>المبلغ (ر.س)</label>
              <input type="number" min="0" style={inputStyle} value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>الحالة</label>
            <select value={status} onChange={e => setStatus(e.target.value as Employee['status'])} style={{ ...inputStyle, width: 200 }}>
              <option value="active">نشط</option>
              <option value="freelance">فريلانسر</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--bg2)', border: '1px solid var(--brd)', color: 'var(--txt3)', cursor: 'pointer' }}>
              إلغاء
            </button>
            <button type="submit" className="btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Employee Profile Modal (الملف الشامل) ─────────────────────────────────────
function EmployeeProfileModal({ employee, onClose, onSave }: {
  employee: Employee;
  onClose: () => void;
  onSave: (e: Employee) => void;
}) {
  const [localName,     setLocalName]     = useState(employee.name);
  const [localRole,     setLocalRole]     = useState(employee.role);
  const [localSalaryType, setLocalSalaryType] = useState<Employee['salary_type']>(employee.salary_type);
  const [localSalaryAmount, setLocalSalaryAmount] = useState(String(employee.salary_amount));
  const [localStatus,   setLocalStatus]   = useState<Employee['status']>(employee.status);
  const [localSopUrl,   setLocalSopUrl]   = useState(employee.sop_url ?? '');
  const [localAccess,   setLocalAccess]   = useState(employee.access_rights ?? '');
  const [localNotes,    setLocalNotes]    = useState(employee.private_notes ?? '');
  const [localKudos,    setLocalKudos]    = useState(employee.kudos ?? 0);
  const [localWarnings, setLocalWarnings] = useState(employee.warnings ?? 0);
  const [localPhone,    setLocalPhone]    = useState(employee.phone ?? '');
  const [localIban,     setLocalIban]     = useState(employee.iban ?? '');
  const [localBrand,    setLocalBrand]    = useState(employee.brand || 'الإدارة العامة');
  const [isUploading,   setIsUploading]   = useState(false);
  // Sync when employee changes
  useEffect(() => {
    setLocalName(employee.name);
    setLocalRole(employee.role);
    setLocalSalaryType(employee.salary_type);
    setLocalSalaryAmount(String(employee.salary_amount));
    setLocalStatus(employee.status);
    setLocalSopUrl(employee.sop_url ?? '');
    setLocalAccess(employee.access_rights ?? '');
    setLocalNotes(employee.private_notes ?? '');
    setLocalKudos(employee.kudos ?? 0);
    setLocalWarnings(employee.warnings ?? 0);
    setLocalPhone(employee.phone ?? '');
    setLocalIban(employee.iban ?? '');
    setLocalBrand(employee.brand || 'الإدارة العامة');
  }, [employee.id]);
  const [saving, setSaving] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const sb = createBrowserClient();
    const fileName = `sop_${employee.id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await sb.storage.from('hr_docs').upload(fileName, file, { upsert: true });
    if (uploadError) {
      alert('خطأ في الرفع: ' + uploadError.message);
    } else {
      const { data } = sb.storage.from('hr_docs').getPublicUrl(fileName);
      setLocalSopUrl(data.publicUrl);
    }
    setIsUploading(false);
  }
  const [error,  setError]  = useState('');

  const salaryLabel = localSalaryType === 'freelance'
    ? 'فريلانسر'
    : `${Number(localSalaryAmount).toLocaleString('ar-SA')} ر.س`;

  async function handleSave() {
    if (!localName || !localRole) { setError('الاسم والوظيفة مطلوبان'); return; }
    setSaving(true); setError('');
    try {
      await updateEmployee(employee.id, {
        name: localName,
        role: localRole,
        salaryType: localSalaryType,
        salaryAmount: Number(localSalaryAmount) || 0,
        status: localStatus,
        sopUrl: localSopUrl || null,
        accessRights: localAccess || null,
        privateNotes: localNotes || null,
        kudos: localKudos,
        warnings: localWarnings,
        phone: localPhone || null,
        iban: localIban || null,
        brand: localBrand || null,
      });
      onSave({
        ...employee,
        name: localName,
        role: localRole,
        salary_type: localSalaryType,
        salary_amount: Number(localSalaryAmount) || 0,
        status: localStatus,
        sop_url: localSopUrl || null,
        access_rights: localAccess || null,
        private_notes: localNotes || null,
        kudos: localKudos,
        warnings: localWarnings,
        phone: localPhone || null,
        iban: localIban || null,
        brand: localBrand || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في الحفظ');
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1',
    fontSize: 12, outline: 'none', background: 'white', color: '#1E293B',
  };

  const STATUS_LABELS: Record<string, string> = { active: 'نشط', freelance: 'فريلانسر', inactive: 'غير نشط' };
  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    active:    { bg: 'rgba(52,199,89,0.15)',  color: '#15803D' },
    freelance: { bg: 'rgba(0,122,255,0.12)',  color: '#1D4ED8' },
    inactive:  { bg: 'rgba(255,59,48,0.12)',  color: '#B91C1C' },
  };

  return (
    <div className="modal-bg on" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          padding: '24px', background: '#F8FAFC', borderRadius: 16,
          maxWidth: 860, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          border: '1px solid #E2E8F0', margin: 'auto', position: 'relative',
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0,
              }}>
                {localName[0]}
              </div>
              <div>
                <input
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <input
                    value={localRole}
                    onChange={e => setLocalRole(e.target.value)}
                    style={{ fontSize: 13, color: '#64748B', border: 'none', background: 'transparent', outline: 'none' }}
                  />
                  <span style={{ fontSize: 12, color: '#64748B' }}>| 💼 الراتب: {salaryLabel}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 10px', borderRadius: 8, fontWeight: 700,
                    background: STATUS_COLORS[localStatus]?.bg, color: STATUS_COLORS[localStatus]?.color,
                  }}>
                    {STATUS_LABELS[localStatus]}
                  </span>
                </div>
              </div>
            </div>
            {/* Salary & Status quick edit */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={localSalaryType} onChange={e => setLocalSalaryType(e.target.value as Employee['salary_type'])}
                style={{ ...fieldStyle, width: 'auto', fontSize: 11, padding: '4px 8px' }}>
                <option value="fixed">راتب ثابت</option>
                <option value="per_unit">بالقطعة</option>
                <option value="freelance">فريلانسر</option>
              </select>
              {localSalaryType !== 'freelance' && (
                <input type="number" min="0" value={localSalaryAmount} onChange={e => setLocalSalaryAmount(e.target.value)}
                  style={{ ...fieldStyle, width: 120, fontSize: 11, padding: '4px 8px' }} placeholder="المبلغ" />
              )}
              <select value={localStatus} onChange={e => setLocalStatus(e.target.value as Employee['status'])}
                style={{ ...fieldStyle, width: 'auto', fontSize: 11, padding: '4px 8px' }}>
                <option value="active">نشط</option>
                <option value="freelance">فريلانسر</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, marginRight: 12 }}>
            {localPhone && (
              <a
                href={`https://wa.me/${localPhone.replace(/\+/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#25D366', color: 'white', padding: '8px 12px',
                  borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                💬 واتساب
              </a>
            )}
            <button onClick={onClose} style={{
              border: 'none', background: '#F1F5F9', padding: '8px 12px',
              borderRadius: 8, cursor: 'pointer', color: '#475569', fontWeight: 700, fontSize: 13,
            }}>
              إغلاق ✕
            </button>
          </div>
        </div>

        {/* BODY — 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

          {/* COLUMN 1: Management & Docs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* SOP Vault — File Upload */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', margin: '0 0 12px' }}>📄 دليل العمل (SOP)</h3>
              {localSopUrl ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a href={localSopUrl} target="_blank" rel="noreferrer"
                    style={{ background: '#EFF6FF', color: '#2563EB', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    🔗 عرض الملف المرفوع
                  </a>
                  <button onClick={() => setLocalSopUrl('')}
                    style={{ color: '#EF4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    حذف ورفع جديد
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    style={{ width: '100%', fontSize: 12 }}
                  />
                  {isUploading && (
                    <span style={{ fontSize: 11, color: '#F59E0B', display: 'block', marginTop: 8 }}>⏳ جاري الرفع...</span>
                  )}
                </div>
              )}
            </div>

            {/* Brand Assignment */}
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <label style={{ fontSize: 13, fontWeight: 900, color: '#1E293B', display: 'block', marginBottom: 8 }}>🏢 تحديد البراند التابع له الموظف</label>
              <select
                value={localBrand || 'الإدارة العامة'}
                onChange={e => setLocalBrand(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: '#FFFFFF', fontWeight: 'bold', cursor: 'pointer', color: '#1E293B' }}
              >
                <option value="الإدارة العامة">الإدارة العامة</option>
                <option value="بيت الجوزاء">بيت الجوزاء</option>
                <option value="غازي بوتيك">غازي بوتيك</option>
                <option value="الجوزاء سويت">الجوزاء سويت</option>
                <option value="أودريد">أودريد</option>
                <option value="فريلانس">فريلانس</option>
              </select>
            </div>

            {/* Access Rights */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', margin: '0 0 12px' }}>🔑 العهد والصلاحيات</h3>
              <textarea
                placeholder="حساب سلة، باسوورد سناب شات، لابتوب الشركة..."
                value={localAccess}
                onChange={e => setLocalAccess(e.target.value)}
                style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>

            {/* HR Data: Phone + IBAN */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>رقم الجوال</label>
                <input
                  type="text"
                  placeholder="+966..."
                  value={localPhone}
                  onChange={e => setLocalPhone(e.target.value)}
                  style={fieldStyle}
                  dir="ltr"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>الآيبان (IBAN)</label>
                <input
                  type="text"
                  placeholder="SA00..."
                  value={localIban}
                  onChange={e => setLocalIban(e.target.value)}
                  style={fieldStyle}
                  dir="ltr"
                />
              </div>
            </div>

          </div>

          {/* COLUMN 2: Performance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Performance Trackers */}
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', gap: 16 }}>
              {/* Kudos */}
              <div style={{ flex: 1, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D', display: 'block', marginBottom: 8 }}>🏆 إنجازات</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <button
                    onClick={() => setLocalKudos(Math.max(0, localKudos - 1))}
                    style={{ background: 'white', border: '1px solid #86EFAC', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >-</button>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#166534', minWidth: 32, textAlign: 'center' }}>{localKudos}</span>
                  <button
                    onClick={() => setLocalKudos(localKudos + 1)}
                    style={{ background: 'white', border: '1px solid #86EFAC', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
              </div>
              {/* Warnings */}
              <div style={{ flex: 1, background: '#FEF2F2', border: '1px solid #FECACA', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', display: 'block', marginBottom: 8 }}>🛑 لفت نظر</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <button
                    onClick={() => setLocalWarnings(Math.max(0, localWarnings - 1))}
                    style={{ background: 'white', border: '1px solid #FCA5A5', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >-</button>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#991B1B', minWidth: 32, textAlign: 'center' }}>{localWarnings}</span>
                  <button
                    onClick={() => setLocalWarnings(localWarnings + 1)}
                    style={{ background: 'white', border: '1px solid #FCA5A5', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Private CEO Notes */}
            <div style={{ background: '#FFFBEB', padding: 16, borderRadius: 12, border: '1px solid #FDE68A', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#92400E', margin: '0 0 12px' }}>🕵️‍♂️ السجل السري (للإدارة فقط)</h3>
              <textarea
                placeholder="سجل هنا ملاحظاتك الخاصة كمدير عن أداء الموظف لتسهيل التقييم السنوي..."
                value={localNotes}
                onChange={e => setLocalNotes(e.target.value)}
                style={{
                  ...fieldStyle, flex: 1, minHeight: 150, resize: 'vertical',
                  background: '#FEF3C7', border: '1px dashed #FCD34D', color: '#92400E', fontSize: 13,
                }}
              />
            </div>

          </div>
        </div>

        {/* SAVE BUTTON */}
        {error && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 12, textAlign: 'center' }}>{error}</p>}
        <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#0F172A', color: 'white', padding: '12px 28px',
              borderRadius: 8, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: 14, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '...' : '💾 حفظ بيانات الموظف'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SettingsClient({ whatsapp: initialWA, contacts: initialContacts, messages: initialMessages, employees: initialEmployees, brands: initialBrands }: Props) {
  const [wa,        setWa]        = useState<WhatsappSettings | null>(initialWA);
  const [contacts,  setContacts]  = useState<TeamContact[]>(initialContacts);
  const [messages,  setMessages]  = useState<DailyMessage[]>(initialMessages);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [brands,    setBrands]    = useState<BrandRow[]>(initialBrands);

  const [toast,        setToast]        = useState('');
  const [, startTransition] = useTransition();

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const [ownerPhone,    setOwnerPhone]    = useState(initialWA?.owner_phone?.replace('whatsapp:', '') ?? '');
  const [reminderTime,  setReminderTime]  = useState(initialWA?.morning_reminder_time ?? '08:00');
  const [savingPhone,   setSavingPhone]   = useState(false);

  const handleToggleWA = useCallback(async (field: keyof WhatsappSettings, value: boolean) => {
    if (!wa) return;
    const updated = { ...wa, [field]: value };
    setWa(updated);
    await updateWhatsappSettings({ [field]: value });
    setToast('تم الحفظ');
  }, [wa]);

  const handleSavePhone = async () => {
    setSavingPhone(true);
    await updateWhatsappSettings({ owner_phone: `whatsapp:${ownerPhone}` });
    setSavingPhone(false);
    setToast('تم حفظ الرقم');
  };

  const handleSaveTime = async () => {
    await updateWhatsappSettings({ morning_reminder_time: reminderTime });
    setToast('تم حفظ الوقت');
  };

  // ── Contacts ──────────────────────────────────────────────────────────────
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName,  setNewContactName]  = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole,  setNewContactRole]  = useState('');

  const handleAddContact = async () => {
    if (!newContactName || !newContactPhone) return;
    await addTeamContact({ name: newContactName, phone: newContactPhone, role: newContactRole });
    setContacts(prev => [...prev, { id: `tc_${Date.now()}`, name: newContactName, phone: newContactPhone, role: newContactRole, active: true }]);
    setNewContactName(''); setNewContactPhone(''); setNewContactRole('');
    setShowAddContact(false);
    setToast('تمت الإضافة');
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    startTransition(async () => { await deleteTeamContact(id); });
  };

  // ── Daily Messages ────────────────────────────────────────────────────────
  const [showAddMsg, setShowAddMsg] = useState(false);
  const [newMsgTime, setNewMsgTime] = useState('09:00');
  const [newMsgText, setNewMsgText] = useState('');

  const handleAddMsg = async () => {
    if (!newMsgText) return;
    await addDailyMessage({ time: newMsgTime, message: newMsgText });
    setMessages(prev => [...prev, { id: `dm_${Date.now()}`, time: newMsgTime, message: newMsgText, enabled: true }]);
    setNewMsgTime('09:00'); setNewMsgText('');
    setShowAddMsg(false);
    setToast('تمت الإضافة');
  };

  const handleToggleMsg = (id: string, enabled: boolean) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, enabled } : m));
    startTransition(async () => { await toggleDailyMessage(id, enabled); });
  };

  const handleDeleteMsg = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    startTransition(async () => { await deleteDailyMessage(id); });
  };

  // ── Brands ────────────────────────────────────────────────────────────────
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editBrand,      setEditBrand]      = useState<BrandRow | null>(null);

  const handleBrandSave = (b: BrandRow, isEdit: boolean) => {
    if (isEdit) setBrands(prev => prev.map(x => x.id === b.id ? b : x));
    else        setBrands(prev => [...prev, b]);
    setToast(isEdit ? 'تم التعديل' : 'تمت الإضافة');
  };

  // ── Employees ─────────────────────────────────────────────────────────────
  const [showAddEmpModal,    setShowAddEmpModal]    = useState(false);
  const [selectedEmployee,   setSelectedEmployee]   = useState<Employee | null>(null);

  const handleEmpAdd = (e: Employee) => {
    setEmployees(prev => [...prev, e]);
    setToast('تمت الإضافة');
  };

  const handleEmpProfileSave = (e: Employee) => {
    setEmployees(prev => prev.map(x => x.id === e.id ? e : x));
    setToast('تم حفظ بيانات الموظف');
  };

  // ── Preferences ──────────────────────────────────────────────────────────
  const [useEastern, setUseEastern] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('useEasternNumerals') === 'true' : false
  );
  const handleToggleEastern = (v: boolean) => {
    setUseEastern(v);
    if (typeof window !== 'undefined') localStorage.setItem('useEasternNumerals', String(v));
    setToast(v ? 'تم تفعيل الأرقام العربية' : 'تم تعطيل الأرقام العربية');
  };

  // ── Data Export ───────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = { brands, employees, contacts, messages };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ghazi-os-backup.json'; a.click();
    URL.revokeObjectURL(url);
    setToast('تم التصدير');
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeEmps    = employees.filter(e => e.status === 'active');
  const freelanceEmps = employees.filter(e => e.status === 'freelance');
  const totalSalary   = employees.filter(e => e.salary_type === 'fixed').reduce((s, e) => s + e.salary_amount, 0);

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8,
    fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none',
  };

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    active:    { bg: 'rgba(52,199,89,0.1)',  color: 'var(--success)' },
    freelance: { bg: 'rgba(0,122,255,0.1)',  color: 'var(--accent)'  },
    inactive:  { bg: 'rgba(255,59,48,0.1)',  color: 'var(--danger)'  },
  };
  const STATUS_LABELS: Record<string, string> = { active: 'نشط', freelance: 'فريلانسر', inactive: 'غير نشط' };

  const BRAND_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    active:   { bg: 'rgba(52,199,89,0.1)',  color: 'var(--success)' },
    paused:   { bg: 'rgba(255,149,0,0.1)',  color: 'var(--warning)' },
    archived: { bg: 'rgba(174,174,178,0.2)', color: 'var(--txt3)'   },
  };
  const BRAND_STATUS_LABELS: Record<string, string> = { active: 'نشط', paused: 'متوقف', archived: 'مؤرشف' };

  return (
    <div className="scr on">

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', marginBottom: 4 }}>الإعدادات</h1>
        <p style={{ fontSize: 12, color: 'var(--txt3)' }}>إدارة النظام والتفضيلات</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          القسم 1: واتساب
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="إعدادات واتساب" icon="📱">
        {!wa ? (
          <p style={{ fontSize: 13, color: 'var(--txt3)', textAlign: 'center', padding: '12px 0' }}>لم يتم تفعيل هذه الميزة بعد</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <RowItem>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>تفعيل التنبيهات</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>إرسال التنبيهات عبر واتساب</div>
              </div>
              <Toggle checked={wa.enabled} onChange={v => handleToggleWA('enabled', v)} />
            </RowItem>
            <RowItem>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>التذكير الصباحي</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>تذكير يومي بالمهام</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="time" value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  onBlur={handleSaveTime}
                  style={{ ...inputStyle, width: 110, direction: 'ltr' }}
                />
                <Toggle checked={wa.morning_reminder_enabled} onChange={v => handleToggleWA('morning_reminder_enabled', v)} />
              </div>
            </RowItem>
            <RowItem>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>تنبيه المهام المتأخرة</div>
              </div>
              <Toggle checked={wa.overdue_alert_enabled} onChange={v => handleToggleWA('overdue_alert_enabled', v)} />
            </RowItem>
            <RowItem>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>تنبيه القرارات</div>
              </div>
              <Toggle checked={wa.decision_alert_enabled} onChange={v => handleToggleWA('decision_alert_enabled', v)} />
            </RowItem>
            <div style={{ paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 8 }}>رقمك الشخصي لاستقبال التنبيهات</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  placeholder="+966XXXXXXXXX"
                  dir="ltr"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button className="btn" onClick={handleSavePhone} disabled={savingPhone}>
                  {savingPhone ? '...' : 'حفظ'}
                </button>
              </div>
            </div>
            <div style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>جهات الفريق</div>
                <button className="btn btn-sm btn-plain" onClick={() => setShowAddContact(true)}>+ إضافة</button>
              </div>
              {contacts.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '8px 0' }}>لا توجد جهات اتصال</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {contacts.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--brd)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                        {c.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)', direction: 'ltr' }}>{c.phone}</div>
                      </div>
                      {c.active && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(52,199,89,0.1)', color: 'var(--success)', fontWeight: 600 }}>نشط</span>}
                      <button onClick={() => handleDeleteContact(c.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt3)')}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showAddContact && (
                <div style={{ marginTop: 12, padding: 14, background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input style={inputStyle} placeholder="الاسم" value={newContactName} onChange={e => setNewContactName(e.target.value)} />
                  <input style={{ ...inputStyle, direction: 'ltr' }} placeholder="+966XXXXXXXXX" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
                  <input style={inputStyle} placeholder="المسمى الوظيفي (اختياري)" value={newContactRole} onChange={e => setNewContactRole(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" onClick={handleAddContact}>إضافة</button>
                    <button className="btn btn-sm btn-plain" onClick={() => setShowAddContact(false)}>إلغاء</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>الرسائل اليومية الثابتة</div>
                <button className="btn btn-sm btn-plain" onClick={() => setShowAddMsg(true)}>+ إضافة</button>
              </div>
              {messages.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '8px 0' }}>لا توجد رسائل</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--brd)' }}>
                      <span style={{ fontSize: 11, color: 'var(--txt3)', fontFamily: 'monospace', direction: 'ltr', minWidth: 40 }}>{m.time}</span>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--txt2)' }}>{m.message}</span>
                      <Toggle checked={m.enabled} onChange={v => handleToggleMsg(m.id, v)} />
                      <button onClick={() => handleDeleteMsg(m.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt3)')}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showAddMsg && (
                <div style={{ marginTop: 12, padding: 14, background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="time" style={{ ...inputStyle, direction: 'ltr', width: 120 }} value={newMsgTime} onChange={e => setNewMsgTime(e.target.value)} />
                  <input style={inputStyle} placeholder="نص الرسالة" value={newMsgText} onChange={e => setNewMsgText(e.target.value)} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" onClick={handleAddMsg}>إضافة</button>
                    <button className="btn btn-sm btn-plain" onClick={() => setShowAddMsg(false)}>إلغاء</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          القسم 2: الفريق
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="إدارة الفريق" icon="👥">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'موظفون نشطون', value: activeEmps.length, color: 'var(--success)' },
            { label: 'فريلانسر', value: freelanceEmps.length, color: 'var(--accent)' },
            { label: 'إجمالي الرواتب', value: `${totalSalary.toLocaleString('ar-SA')} ر.س`, color: 'var(--gold)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--brd)' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-sm" onClick={() => setShowAddEmpModal(true)}>+ موظف</button>
        </div>

        {/* Grouped by Brand — Compact Seamless List */}
        {(() => {
          const parseSalary = (emp: Employee) =>
            emp.salary_type === 'freelance' ? 0 : emp.salary_amount;
          const grouped = employees.reduce((acc, emp) => {
            const brandKey = emp.brand || 'الإدارة العامة';
            if (!acc[brandKey]) acc[brandKey] = [];
            acc[brandKey].push(emp);
            return acc;
          }, {} as Record<string, Employee[]>);

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', width: '100%', marginTop: '8px', alignItems: 'start' }}>
              {Object.entries(grouped).map(([brandName, emps]) => {
                const totalCost = emps.reduce((sum, emp) => sum + parseSalary(emp), 0);
                return (
                  <div key={brandName} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                    {/* Sleek Brand Header */}
                    <div style={{ background: '#F8FAFC', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px' }}>🏢</span>
                        <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A', margin: 0 }}>{brandName}</h3>
                        <span style={{ background: '#E2E8F0', color: '#475569', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>{emps.length}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        {totalCost.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    {/* Seamless Employee List — no nested cards */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {emps.map((emp, idx) => (
                        <div
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          style={{
                            padding: '11px 18px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: idx === emps.length - 1 ? 'none' : '1px dashed #E2E8F0',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: '#475569', fontSize: '13px', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                              {emp.name.charAt(0)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{emp.name}</span>
                                <div
                                  title={STATUS_LABELS[emp.status] || 'نشط'}
                                  style={{ width: '7px', height: '7px', borderRadius: '50%', background: emp.status === 'active' ? '#10B981' : emp.status === 'inactive' ? '#EF4444' : '#10B981', flexShrink: 0 }}
                                />
                                {((emp.kudos ?? 0) > 0) && (
                                  <span style={{ fontSize: '10px', color: '#15803D', fontWeight: 700 }}>🏆{emp.kudos}</span>
                                )}
                                {((emp.warnings ?? 0) > 0) && (
                                  <span style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 700 }}>🛑{emp.warnings}</span>
                                )}
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>{emp.role}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#059669', whiteSpace: 'nowrap' }}>
                            {emp.salary_type === 'freelance' ? 'فريلانسر' : `${emp.salary_amount.toLocaleString('ar-SA')} ر.س`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          القسم 3: البراندات
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="إدارة البراندات" icon="🏷️">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{brands.length} براند</span>
          <button className="btn btn-sm" onClick={() => { setEditBrand(null); setShowBrandModal(true); }}>+ براند جديد</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {brands.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--brd)', cursor: 'pointer' }}
              onClick={() => { setEditBrand(b); setShowBrandModal(true); }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${b.color}22`, border: `1px solid ${b.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {b.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{b.name}</div>
                {b.nameEn && <div style={{ fontSize: 11, color: 'var(--txt3)', direction: 'ltr' }}>{b.nameEn}</div>}
              </div>
              <span style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 8, fontWeight: 600,
                background: BRAND_STATUS_COLORS[b.status]?.bg, color: BRAND_STATUS_COLORS[b.status]?.color,
              }}>
                {BRAND_STATUS_LABELS[b.status]}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          القسم 4: التفضيلات
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="التفضيلات" icon="⚙️">
        <RowItem>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>الأرقام العربية</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>عرض الأرقام بالشكل العربي (٠١٢٣...)</div>
          </div>
          <Toggle checked={useEastern} onChange={handleToggleEastern} />
        </RowItem>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          القسم 5: البيانات
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="البيانات والنسخ الاحتياطي" icon="💾">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--txt3)' }}>تصدير جميع بيانات النظام كملف JSON</div>
          <button className="btn" onClick={handleExport} style={{ width: 'fit-content' }}>
            ⬇️ تصدير البيانات
          </button>
        </div>
      </SectionCard>

      {/* ── Modals ── */}
      {showBrandModal && (
        <BrandModal
          editBrand={editBrand}
          onClose={() => { setShowBrandModal(false); setEditBrand(null); }}
          onSave={handleBrandSave}
        />
      )}
      {showAddEmpModal && (
        <EmployeeAddModal
          onClose={() => setShowAddEmpModal(false)}
          onSave={handleEmpAdd}
        />
      )}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSave={handleEmpProfileSave}
        />
      )}
      {/* ── Toast ── */}
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
