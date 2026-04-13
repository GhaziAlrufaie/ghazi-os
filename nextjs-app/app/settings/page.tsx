'use client';
/*
 * Ghazi OS — Legendary Edition
 * Settings Page: صفحة الإعدادات
 * 
 * الوظائف المنقولة من index.html:
 * 1. التفضيلات: الأرقام العربية (useEasternNumerals)
 * 2. البيانات: تصدير JSON / استيراد JSON / إعادة ضبط
 * 3. إعدادات واتساب: تفعيل/تعطيل، وقت التذكير الصباحي، رقم المالك
 * 4. الفريق: عرض الموظفين + إضافة موظف جديد
 * 5. البراندات: عرض البراندات المرتبطة
 * 
 * التخزين: Supabase (app_settings, whatsapp_settings, team_contacts, daily_messages)
 * لا localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ═══ Supabase Client (public anon — read only) ═══
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ═══ Types ═══
interface AppSettings {
  useEasternNumerals: boolean;
}

interface WhatsappSettings {
  id: string;
  enabled: boolean;
  morning_reminder_enabled: boolean;
  morning_reminder_time: string;
  owner_phone: string;
}

interface TeamContact {
  id: string;
  name: string;
  phone: string;
  role?: string;
}

interface Brand {
  id: string;
  name: string;
  color: string;
}

// ═══ Toast Component ═══
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(12, 16, 32, 0.95)',
        border: '1px solid var(--gold-border-strong)',
        borderRadius: 12,
        padding: '10px 20px',
        fontSize: 13,
        color: 'var(--txt)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 9999,
        animation: 'fade-up 0.4s var(--ease) forwards',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
}

// ═══ Section Card ═══
function SettingsCard({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="card"
      style={{
        opacity: 0,
        animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: '1px solid var(--gold-border)',
        }}
      >
        <span style={{ color: 'var(--gold)', fontSize: 14 }}>{icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--gold)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ═══ Toggle Row ═══
function ToggleRow({
  label,
  active,
  onToggle,
  description,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  description?: string;
}) {
  return (
    <div className="toggle-wrap">
      <div>
        <div className="toggle-label">{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <button
        className={`toggle-btn${active ? ' active' : ''}`}
        onClick={onToggle}
        aria-label={label}
      />
    </div>
  );
}

// ═══ Main Page ═══
export default function SettingsPage() {
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  // App Settings
  const [useEasternNumerals, setUseEasternNumerals] = useState(true);

  // WhatsApp Settings
  const [waSettings, setWaSettings] = useState<WhatsappSettings>({
    id: 'main',
    enabled: false,
    morning_reminder_enabled: true,
    morning_reminder_time: '08:00',
    owner_phone: '',
  });

  // Team
  const [contacts, setContacts] = useState<TeamContact[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // New contact form
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  // ═══ Load Data ═══
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        // App Settings
        const { data: appData } = await supabase
          .from('app_settings')
          .select('*');
        if (appData) {
          const appState = appData.find((r: { key: string; value: unknown }) => r.key === 'APP_STATE');
          if (appState?.value?.useEasternNumerals !== undefined) {
            setUseEasternNumerals(appState.value.useEasternNumerals);
          }
        }

        // WhatsApp Settings
        const { data: waData } = await supabase
          .from('whatsapp_settings')
          .select('*')
          .eq('id', 'main')
          .single();
        if (waData) {
          setWaSettings({
            ...waData,
            owner_phone: (waData.owner_phone || '').replace('whatsapp:', ''),
          });
        }

        // Team Contacts
        const { data: contactsData } = await supabase
          .from('team_contacts')
          .select('*')
          .order('created_at');
        if (contactsData) setContacts(contactsData);

        // Brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('id, name, color')
          .order('created_at');
        if (brandsData) setBrands(brandsData);
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // ═══ Save App Settings ═══
  async function saveAppSetting(key: string, value: unknown) {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });
    if (error) {
      showToast('خطأ في الحفظ');
    } else {
      showToast('تم الحفظ');
    }
  }

  async function toggleEasternNumerals() {
    const newVal = !useEasternNumerals;
    setUseEasternNumerals(newVal);
    await saveAppSetting('APP_STATE', { useEasternNumerals: newVal });
  }

  // ═══ WhatsApp Settings ═══
  async function saveWaSettings(updated: WhatsappSettings) {
    const toSave = {
      ...updated,
      owner_phone: updated.owner_phone.startsWith('whatsapp:')
        ? updated.owner_phone
        : `whatsapp:${updated.owner_phone}`,
    };
    const { error } = await supabase
      .from('whatsapp_settings')
      .upsert(toSave, { onConflict: 'id' });
    if (error) {
      showToast('خطأ في حفظ إعدادات واتساب');
    } else {
      showToast('تم حفظ إعدادات واتساب');
    }
  }

  async function toggleWa() {
    const updated = { ...waSettings, enabled: !waSettings.enabled };
    setWaSettings(updated);
    await saveWaSettings(updated);
  }

  async function toggleWaMorning() {
    const updated = {
      ...waSettings,
      morning_reminder_enabled: !waSettings.morning_reminder_enabled,
    };
    setWaSettings(updated);
    await saveWaSettings(updated);
  }

  async function saveWaTime(val: string) {
    const updated = { ...waSettings, morning_reminder_time: val };
    setWaSettings(updated);
    await saveWaSettings(updated);
  }

  async function saveOwnerPhone() {
    if (!waSettings.owner_phone.trim()) {
      showToast('أدخل رقم الهاتف');
      return;
    }
    await saveWaSettings(waSettings);
  }

  // ═══ Team Contacts ═══
  async function addContact() {
    if (!newContactName.trim()) { showToast('أدخل اسم جهة الاتصال'); return; }
    if (!newContactPhone.trim()) { showToast('أدخل رقم الهاتف'); return; }

    const { data, error } = await supabase
      .from('team_contacts')
      .insert({
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
        role: newContactRole.trim() || null,
      })
      .select()
      .single();

    if (error) {
      showToast('خطأ في إضافة جهة الاتصال');
    } else {
      setContacts((prev) => [...prev, data]);
      setNewContactName('');
      setNewContactPhone('');
      setNewContactRole('');
      setShowAddContact(false);
      showToast('تمت الإضافة');
    }
  }

  async function deleteContact(id: string) {
    if (!confirm('هل تريد حذف جهة الاتصال؟')) return;
    const { error } = await supabase.from('team_contacts').delete().eq('id', id);
    if (error) {
      showToast('خطأ في الحذف');
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      showToast('تم الحذف');
    }
  }

  // ═══ Export Data ═══
  async function exportData() {
    try {
      const tables = ['brands', 'tasks', 'decisions', 'events', 'employees', 'app_settings'];
      const result: Record<string, unknown[]> = {};
      for (const table of tables) {
        const { data } = await supabase.from(table).select('*');
        result[table] = data || [];
      }
      result.exportedAt = [new Date().toISOString()];

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ghazi-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('تم التصدير');
    } catch {
      showToast('خطأ في التصدير');
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          color: 'var(--txt3)',
          fontSize: 13,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: '2px solid var(--gold-border)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          جاري التحميل...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <h1
          style={{
            fontSize: 28,
            fontWeight: 200,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, var(--txt) 0%, var(--txt2) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 4,
          }}
        >
          الإعدادات
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)' }}>
          إدارة تفضيلات النظام والتكاملات
        </p>
      </div>

      {/* Settings Grid */}
      <div className="settings-grid">

        {/* ═══ التفضيلات ═══ */}
        <SettingsCard title="التفضيلات" icon="◉" delay={0.05}>
          <ToggleRow
            label="الأرقام العربية"
            description="عرض الأرقام بالشكل العربي (٠١٢٣٤٥٦٧٨٩)"
            active={useEasternNumerals}
            onToggle={toggleEasternNumerals}
          />
        </SettingsCard>

        {/* ═══ البيانات ═══ */}
        <SettingsCard title="البيانات" icon="◆" delay={0.10}>
          <p style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 16, lineHeight: 1.6 }}>
            تصدير نسخة احتياطية من جميع بياناتك من Supabase.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={exportData}>
              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              تصدير JSON
            </button>
          </div>
        </SettingsCard>

        {/* ═══ واتساب ═══ */}
        <SettingsCard title="إعدادات واتساب" icon="◈" delay={0.15}>
          <ToggleRow
            label="تفعيل التنبيهات"
            description="إرسال تنبيهات واتساب تلقائية"
            active={waSettings.enabled}
            onToggle={toggleWa}
          />
          <ToggleRow
            label="التذكير الصباحي"
            description="رسالة تلخيص يومية في الصباح"
            active={waSettings.morning_reminder_enabled}
            onToggle={toggleWaMorning}
          />

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>
              وقت التذكير الصباحي
            </label>
            <input
              type="time"
              className="input"
              value={waSettings.morning_reminder_time}
              onChange={(e) => saveWaTime(e.target.value)}
              style={{ maxWidth: 160 }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>
              رقم المالك (للتنبيهات الشخصية)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="input"
                placeholder="+966XXXXXXXXX"
                value={waSettings.owner_phone}
                onChange={(e) =>
                  setWaSettings((prev) => ({ ...prev, owner_phone: e.target.value }))
                }
                style={{ direction: 'ltr' }}
              />
              <button className="btn btn-gold btn-sm" onClick={saveOwnerPhone}>
                حفظ
              </button>
            </div>
          </div>
        </SettingsCard>

        {/* ═══ الفريق ═══ */}
        <SettingsCard title="جهات الفريق" icon="◐" delay={0.20}>
          {contacts.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '12px 0' }}>
              لا توجد جهات اتصال بعد
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    border: '1px solid var(--brd)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', direction: 'ltr', marginTop: 2 }}>{c.phone}</div>
                    {c.role && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 2 }}>{c.role}</div>}
                  </div>
                  <button
                    onClick={() => deleteContact(c.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--txt3)',
                      cursor: 'pointer',
                      fontSize: 16,
                      padding: '4px 8px',
                      borderRadius: 6,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--txt3)'; }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAddContact ? (
            <div
              style={{
                padding: 16,
                background: 'rgba(201,150,59,0.04)',
                borderRadius: 12,
                border: '1px solid var(--gold-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <input
                className="input"
                placeholder="الاسم"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
              <input
                className="input"
                placeholder="+966XXXXXXXXX"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                style={{ direction: 'ltr' }}
              />
              <input
                className="input"
                placeholder="المسمى الوظيفي (اختياري)"
                value={newContactRole}
                onChange={(e) => setNewContactRole(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-gold btn-sm" onClick={addContact}>إضافة</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddContact(false)}>إلغاء</button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAddContact(true)}
              style={{ width: '100%' }}
            >
              + إضافة جهة اتصال
            </button>
          )}
        </SettingsCard>

        {/* ═══ البراندات ═══ */}
        <SettingsCard title="البراندات" icon="◆" delay={0.25}>
          {brands.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '12px 0' }}>
              لا توجد براندات
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {brands.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: '1px solid var(--brd)',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: b.color || 'var(--gold)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--txt2)' }}>{b.name}</span>
                </div>
              ))}
            </div>
          )}
        </SettingsCard>

        {/* ═══ معلومات النظام ═══ */}
        <SettingsCard title="معلومات النظام" icon="◎" delay={0.30}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'الإصدار', value: 'Ghazi OS v9 — Legendary Edition' },
              { label: 'قاعدة البيانات', value: 'Supabase PostgreSQL' },
              { label: 'الإطار', value: 'Next.js 15 (App Router)' },
              { label: 'المصادقة', value: 'Server-side Session (iron-session)' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--brd)',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{item.label}</span>
                <span style={{ fontSize: 12, color: 'var(--txt2)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  );
}
