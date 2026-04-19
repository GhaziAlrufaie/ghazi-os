'use client';
// Design: Worlds page — Zen Dashboard + 5 tabs (zen/health/family/growth/wealth)
// Data is local/static as in index.html original — no Supabase tables for worlds
import { useState, useEffect } from 'react';

type Tab = 'zen' | 'health' | 'family' | 'growth' | 'wealth';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'zen',    label: 'الزن',        emoji: '🌙' },
  { id: 'health', label: 'الصحة',       emoji: '💚' },
  { id: 'family', label: 'العائلة',     emoji: '👨‍👩‍👧‍👦' },
  { id: 'growth', label: 'التطوير',     emoji: '🚀' },
  { id: 'wealth', label: 'الثروة',      emoji: '💎' },
];

const HABITS = [
  { id: 'h1', name: 'صلاة الفجر', icon: '🕌', streak: 12 },
  { id: 'h2', name: 'قراءة 30 دقيقة', icon: '📚', streak: 7 },
  { id: 'h3', name: 'رياضة', icon: '💪', streak: 5 },
  { id: 'h4', name: 'شرب 2L ماء', icon: '💧', streak: 14 },
  { id: 'h5', name: 'تأمل 10 دقائق', icon: '🧘', streak: 3 },
  { id: 'h6', name: 'النوم 10:30م', icon: '😴', streak: 2 },
];

const FAMILY_MEMBERS = [
  { id: 'm1', name: 'الأم', emoji: '👩', color: '#f59e0b' },
  { id: 'm2', name: 'الأب', emoji: '👨', color: '#3b82f6' },
  { id: 'm3', name: 'الأخت ريم', emoji: '👧', color: '#ec4899' },
  { id: 'm4', name: 'الأخ عمر', emoji: '👦', color: '#10b981' },
];

const FAMILY_EVENTS = [
  { id: 'e1', title: 'عشاء عائلي', date: '2026-04-25', emoji: '🍽️', memberColor: '#f59e0b' },
  { id: 'e2', title: 'زيارة الجدة', date: '2026-04-28', emoji: '🏠', memberColor: '#3b82f6' },
  { id: 'e3', title: 'عيد ميلاد ريم', date: '2026-05-10', emoji: '🎂', memberColor: '#ec4899' },
];

const FAMILY_TASKS = [
  { id: 't1', title: 'تجديد جواز سفر الأم', status: 'pending', member: 'الأم' },
  { id: 't2', title: 'حجز رحلة العائلة', status: 'pending', member: 'الكل' },
  { id: 't3', title: 'إصلاح السيارة', status: 'done', member: 'الأب' },
];

const LEARNING = [
  { id: 'l1', title: 'Next.js 15', status: 'active', progress: 65, platform: 'Udemy' },
  { id: 'l2', title: 'TypeScript Advanced', status: 'active', progress: 40, platform: 'Frontend Masters' },
  { id: 'l3', title: 'Supabase Deep Dive', status: 'paused', progress: 20, platform: 'YouTube' },
];

const IDEAS = [
  { id: 'i1', title: 'تطبيق تتبع العادات', status: 'active', category: 'تقنية' },
  { id: 'i2', title: 'مشروع استثمار عقاري', status: 'active', category: 'مالي' },
  { id: 'i3', title: 'كورس تسويق رقمي', status: 'idea', category: 'تعليم' },
];

const ACCOUNTS = [
  { id: 'a1', name: 'الراجحي الجاري', balance: 45200, type: 'bank', icon: '🏦' },
  { id: 'a2', name: 'محفظة الاستثمار', balance: 120000, type: 'investment', icon: '📈' },
  { id: 'a3', name: 'صندوق الطوارئ', balance: 30000, type: 'savings', icon: '🛡️' },
  { id: 'a4', name: 'محفظة التشغيل', balance: 18500, type: 'business', icon: '💼' },
];

const QUOTES = [
  { text: '"الانضباط هو الجسر بين الأهداف والإنجاز"', author: 'جيم رون' },
  { text: '"لا تنتظر الظروف المثالية — ابدأ الآن بما لديك"', author: 'آرثر أشي' },
  { text: '"كل يوم هو فرصة جديدة لتكون أفضل مما كنت عليه أمس"', author: 'مجهول' },
  { text: '"الوقت لا يعود — استثمر كل لحظة بحكمة"', author: 'مجهول' },
];

function ZenTab() {
  const [time, setTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState('');
  const [bgGrad, setBgGrad] = useState('');
  const [textCol, setTextCol] = useState('#fff');
  const [textMuted, setTextMuted] = useState('rgba(255,255,255,0.7)');
  const [quote, setQuote] = useState(QUOTES[0]);
  const [dateStr, setDateStr] = useState('');
  const [dayName, setDayName] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      setTime(`${h.toString().padStart(2, '0')}:${m}:${s}`);
      if (h < 5) { setGreeting('طاب ليلك'); setGreetingIcon('🌙'); }
      else if (h < 12) { setGreeting('صباح الخير'); setGreetingIcon('☀️'); }
      else if (h < 17) { setGreeting('مرحباً'); setGreetingIcon('🌤️'); }
      else if (h < 20) { setGreeting('مساء الخير'); setGreetingIcon('🌅'); }
      else { setGreeting('طاب مساؤك'); setGreetingIcon('🌙'); }
      const bg = h < 6 ? 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)'
        : h < 12 ? 'linear-gradient(135deg,#fef3c7,#fde68a,#f59e0b,#d97706)'
        : h < 17 ? 'linear-gradient(135deg,#dbeafe,#93c5fd,#3b82f6,#2563eb)'
        : h < 20 ? 'linear-gradient(135deg,#fed7aa,#fb923c,#ea580c,#9a3412)'
        : 'linear-gradient(135deg,#1e1b4b,#312e81,#6d28d9)';
      setBgGrad(bg);
      const light = h < 6 || h >= 20;
      setTextCol(light ? '#fff' : (h < 12 ? '#78350f' : '#1e3a5f'));
      setTextMuted(light ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)');
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      setDayName(days[now.getDay()]);
      setDateStr(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
      setQuote(QUOTES[now.getDate() % QUOTES.length]);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const habitsToday = 4; // demo
  const healthPct = Math.round((habitsToday / HABITS.length) * 100);
  const pendingFamily = FAMILY_TASKS.filter((t) => t.status === 'pending').length;
  const nextEvent = FAMILY_EVENTS[0];
  const totalBalance = ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const activelearning = LEARNING.filter((l) => l.status === 'active').length;
  const activeIdeas = IDEAS.filter((i) => i.status === 'active').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 flex items-center justify-between" style={{ background: bgGrad }}>
        <div>
          <div className="text-sm font-medium mb-1" style={{ color: textMuted }}>{greetingIcon} {greeting}، غازي</div>
          <div className="text-lg font-bold mb-2" style={{ color: textCol }}>{dayName}، {dateStr}</div>
          <div className="text-sm italic max-w-xs" style={{ color: textMuted }}>
            {quote.text}
            <span className="block text-xs mt-1">— {quote.author}</span>
          </div>
        </div>
        <div className="text-4xl font-mono font-bold tabular-nums" style={{ color: textCol }}>{time}</div>
      </div>
      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>💚</div>
            <div>
              <div className="text-xs text-gray-500">الصحة اليوم</div>
              <div className="text-2xl font-bold text-white">{habitsToday}/{HABITS.length}</div>
              <div className="text-xs text-gray-500">عادة مكتملة</div>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${healthPct}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
          </div>
        </div>
        <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}>👨‍👩‍👧‍👦</div>
            <div>
              <div className="text-xs text-gray-500">العائلة</div>
              <div className="text-2xl font-bold text-white">{pendingFamily}</div>
              <div className="text-xs text-gray-500">مهمة معلقة</div>
            </div>
          </div>
          {nextEvent && <div className="text-xs text-gray-500">📅 {nextEvent.emoji} {nextEvent.title}</div>}
        </div>
        <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' }}>💎</div>
            <div>
              <div className="text-xs text-gray-500">صافي الثروة</div>
              <div className="text-xl font-bold text-white">{totalBalance.toLocaleString('ar-SA')}</div>
              <div className="text-xs text-gray-500">ريال سعودي</div>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>🚀</div>
            <div>
              <div className="text-xs text-gray-500">التطوير</div>
              <div className="text-2xl font-bold text-white">{activelearning}</div>
              <div className="text-xs text-gray-500">قيد التعلم</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">💡 {activeIdeas} أفكار نشطة</div>
        </div>
      </div>
      {/* Upcoming Events */}
      <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">⚡ نبضات اليوم</h3>
        <div className="flex flex-col gap-2">
          {FAMILY_EVENTS.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.memberColor }} />
              <span className="text-sm text-gray-300 flex-1">{e.emoji} {e.title}</span>
              <span className="text-xs text-gray-500">{e.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthTab() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / HABITS.length) * 100);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">💚 الصحة والعادات</h2>
        <span className="text-sm text-gray-400">{done}/{HABITS.length} اليوم</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {HABITS.map((h) => (
          <button key={h.id} onClick={() => setChecked((prev) => ({ ...prev, [h.id]: !prev[h.id] }))}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
              checked[h.id] ? 'bg-green-500/10 border-green-500/30' : 'bg-[#1a1a2e] border-white/8 hover:border-white/20'
            }`}>
            <span className="text-2xl">{h.icon}</span>
            <div className="flex-1">
              <div className={`text-sm font-medium ${checked[h.id] ? 'text-green-400 line-through' : 'text-gray-200'}`}>{h.name}</div>
              <div className="text-xs text-gray-500">🔥 {h.streak} يوم</div>
            </div>
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              checked[h.id] ? 'bg-green-500 border-green-500 text-white' : 'border-white/20'
            }`}>
              {checked[h.id] && '✓'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FamilyTab() {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-white">👨‍👩‍👧‍👦 العائلة</h2>
      {/* Members */}
      <div className="flex gap-3 flex-wrap">
        {FAMILY_MEMBERS.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2" style={{ borderColor: m.color, background: m.color + '20' }}>{m.emoji}</div>
            <span className="text-xs text-gray-400">{m.name}</span>
          </div>
        ))}
      </div>
      {/* Events */}
      <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📅 المناسبات القادمة</h3>
        <div className="flex flex-col gap-2">
          {FAMILY_EVENTS.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="text-xl">{e.emoji}</span>
              <span className="flex-1 text-sm text-gray-200">{e.title}</span>
              <span className="text-xs text-gray-500">{e.date}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Tasks */}
      <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">✅ مهام العائلة</h3>
        <div className="flex flex-col gap-2">
          {FAMILY_TASKS.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
                t.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-white/20'
              }`}>{t.status === 'done' && '✓'}</span>
              <span className={`flex-1 text-sm ${t.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{t.title}</span>
              <span className="text-xs text-gray-500">{t.member}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GrowthTab() {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-white">🚀 التطوير الذاتي</h2>
      {/* Learning */}
      <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">📚 التعلم الحالي</h3>
        <div className="flex flex-col gap-3">
          {LEARNING.map((l) => (
            <div key={l.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-200">{l.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {l.status === 'active' ? 'نشط' : 'متوقف'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${l.progress}%` }} />
                </div>
                <span className="text-xs text-gray-500">{l.progress}%</span>
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{l.platform}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Ideas */}
      <div className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">💡 الأفكار</h3>
        <div className="flex flex-col gap-2">
          {IDEAS.map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="text-lg">💡</span>
              <span className="flex-1 text-sm text-gray-200">{i.title}</span>
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{i.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WealthTab() {
  const total = ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">💎 الثروة والحسابات</h2>
        <div className="text-right">
          <div className="text-xs text-gray-500">إجمالي</div>
          <div className="text-xl font-bold text-white">{total.toLocaleString('ar-SA')} ر.س</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ACCOUNTS.map((a) => (
          <div key={a.id} className="bg-[#1a1a2e] border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs text-gray-500">{a.name}</span>
            </div>
            <div className="text-xl font-bold text-white">{a.balance.toLocaleString('ar-SA')}</div>
            <div className="text-xs text-gray-500 mt-0.5">ريال سعودي</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorldsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('zen');
  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/3 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              activeTab === t.id ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-gray-300'
            }`}>
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'zen'    && <ZenTab />}
        {activeTab === 'health' && <HealthTab />}
        {activeTab === 'family' && <FamilyTab />}
        {activeTab === 'growth' && <GrowthTab />}
        {activeTab === 'wealth' && <WealthTab />}
      </div>
    </div>
  );
}
