'use client';
// SettingsClient — صفحة الإعدادات
// Layout: .scr.on wrapper — نفس /brands و /calendar
// 5 أقسام: واتساب | الفريق | البراندات | التفضيلات | البيانات
import { useState, useTransition, useCallback } from 'react';
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

// ─── Employee Modal ────────────────────────────────────────────────────────────
function EmployeeModal({ editEmp, onClose, onSave }: {
  editEmp?: Employee | null;
  onClose: () => void;
  onSave: (e: Employee, isEdit: boolean) => void;
}) {
  const isEdit = !!editEmp;
  const [name,         setName]         = useState(editEmp?.name ?? '');
  const [role,         setRole]         = useState(editEmp?.role ?? '');
  const [salaryType,   setSalaryType]   = useState<Employee['salary_type']>(editEmp?.salary_type ?? 'fixed');
  const [salaryAmount, setSalaryAmount] = useState(String(editEmp?.salary_amount ?? ''));
  const [status,       setStatus]       = useState<Employee['status']>(editEmp?.status ?? 'active');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !role) { setError('أدخل الاسم والوظيفة'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit && editEmp) {
        await updateEmployee(editEmp.id, {
          name, role, salaryType, salaryAmount: Number(salaryAmount) || 0, status,
        });
        onSave({ ...editEmp, name, role, salary_type: salaryType, salary_amount: Number(salaryAmount) || 0, status }, true);
      } else {
        const newEmp = await addEmployee({
          name, role, brandIds: [], salaryType, salaryAmount: Number(salaryAmount) || 0, status,
        });
        onSave(newEmp, false);
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
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', marginBottom: 20 }}>
          {isEdit ? 'تعديل الموظف' : '+ موظف جديد'}
        </h2>
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
              {loading ? '...' : isEdit ? 'حفظ' : 'إضافة'}
            </button>
          </div>
        </form>
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
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editEmp,      setEditEmp]      = useState<Employee | null>(null);

  const handleEmpSave = (e: Employee, isEdit: boolean) => {
    if (isEdit) setEmployees(prev => prev.map(x => x.id === e.id ? e : x));
    else        setEmployees(prev => [...prev, e]);
    setToast(isEdit ? 'تم التعديل' : 'تمت الإضافة');
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
            {/* Toggle تفعيل */}
            <RowItem>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>تفعيل التنبيهات</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>إرسال التنبيهات عبر واتساب</div>
              </div>
              <Toggle checked={wa.enabled} onChange={v => handleToggleWA('enabled', v)} />
            </RowItem>

            {/* Toggle التذكير الصباحي */}
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

            {/* Toggle تنبيه المتأخرة */}
            <RowItem>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>تنبيه المهام المتأخرة</div>
              </div>
              <Toggle checked={wa.overdue_alert_enabled} onChange={v => handleToggleWA('overdue_alert_enabled', v)} />
            </RowItem>

            {/* Toggle تنبيه القرارات */}
            <RowItem>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>تنبيه القرارات</div>
              </div>
              <Toggle checked={wa.decision_alert_enabled} onChange={v => handleToggleWA('decision_alert_enabled', v)} />
            </RowItem>

            {/* رقم المالك */}
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

            {/* جهات الفريق */}
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

            {/* الرسائل اليومية */}
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

            {/* زر إرسال اختبار */}
            <div style={{ paddingTop: 20 }}>
              <button
                className="btn"
                style={{ width: '100%', padding: '12px', fontSize: 14, justifyContent: 'center' }}
                onClick={() => setToast('تم إرسال رسالة الاختبار (يتطلب تفعيل Twilio)')}
              >
                📤 إرسال رسالة اختبار
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          القسم 2: الفريق
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="الفريق" icon="👥">
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'نشط', value: activeEmps.length,    color: 'var(--success)' },
            { label: 'فريلانس', value: freelanceEmps.length, color: 'var(--accent)'  },
            { label: 'إجمالي شهري', value: `${totalSalary.toLocaleString('ar-SA')} ر.س`, color: 'var(--gold)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active + Freelance */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>الموظفون النشطون</div>
            <button className="btn btn-sm" onClick={() => { setEditEmp(null); setShowEmpModal(true); }}>+ موظف</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {employees.filter(e => e.status !== 'inactive').map(emp => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--brd)', cursor: 'pointer' }}
                onClick={() => { setEditEmp(emp); setShowEmpModal(true); }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--gold)', flexShrink: 0 }}>
                  {emp.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>{emp.role}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>
                    {emp.salary_type === 'freelance' ? 'فريلانسر' : `${emp.salary_amount.toLocaleString('ar-SA')} ر.س`}
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 8, fontWeight: 600, background: STATUS_COLORS[emp.status]?.bg, color: STATUS_COLORS[emp.status]?.color }}>
                  {STATUS_LABELS[emp.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inactive */}
        {employees.filter(e => e.status === 'inactive').length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt3)', marginBottom: 8 }}>غير نشط</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {employees.filter(e => e.status === 'inactive').map(emp => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--brd)', opacity: 0.6, cursor: 'pointer' }}
                  onClick={() => { setEditEmp(emp); setShowEmpModal(true); }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--txt3)', flexShrink: 0 }}>
                    {emp.name[0]}
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: 'var(--txt2)' }}>{emp.name} — {emp.role}</div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,59,48,0.1)', color: 'var(--danger)', fontWeight: 600 }}>غير نشط</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--brd)' }}>
              <span style={{ fontSize: 18 }}>{b.icon}</span>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{b.name}</div>
                {b.description && <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 1 }}>{b.description}</div>}
              </div>
              <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 8, fontWeight: 600, background: BRAND_STATUS_COLORS[b.status]?.bg, color: BRAND_STATUS_COLORS[b.status]?.color }}>
                {BRAND_STATUS_LABELS[b.status]}
              </span>
              <button className="btn btn-sm btn-plain" onClick={() => { setEditBrand(b); setShowBrandModal(true); }}>تعديل</button>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>الأرقام العربية (٠١٢٣)</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>عرض الأرقام بالشكل العربي في النظام</div>
          </div>
          <Toggle checked={useEastern} onChange={handleToggleEastern} />
        </RowItem>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          القسم 5: البيانات
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="البيانات" icon="💾">
        <p style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 16, lineHeight: 1.6 }}>
          البيانات محفوظة في Supabase. استخدم التصدير للنسخ الاحتياطي.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn" style={{ width: '100%', padding: '10px', fontSize: 13, justifyContent: 'center' }} onClick={handleExport}>
            📤 تصدير JSON
          </button>
          <label style={{ cursor: 'pointer' }}>
            <div className="btn btn-plain" style={{ width: '100%', padding: '10px', fontSize: 13, textAlign: 'center', display: 'block' }}>
              📥 استيراد JSON
            </div>
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setToast('تم قراءة الملف — الاستيراد يتطلب تفعيلاً يدوياً');
              reader.readAsText(file);
            }} />
          </label>
          <button
            style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.05)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            onClick={() => {
              if (confirm('هل أنت متأكد من إعادة الضبط؟')) {
                if (confirm('هذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟')) {
                  setToast('إعادة الضبط تتطلب تأكيداً إضافياً من المطور');
                }
              }
            }}
          >
            🗑️ إعادة ضبط
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
      {showEmpModal && (
        <EmployeeModal
          editEmp={editEmp}
          onClose={() => { setShowEmpModal(false); setEditEmp(null); }}
          onSave={handleEmpSave}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
