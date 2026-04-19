'use client';
// Design: Worlds page — exact replica of index.html renderWorlds()
// Tabs: zen/family/health/growth/wealth with full Bento Grid layouts
// Data: static (same as index.html original)
import { useState, useEffect, useRef } from 'react';

type Tab = 'zen' | 'family' | 'health' | 'growth' | 'wealth';

// ═══════════════════════════════════════
// DATA — العائلة
// ═══════════════════════════════════════
const W2_FAMILY_MEMBERS = [
  { id: 'wfm1', name: 'أم حمود', relation: 'زوجة', emoji: '👩', birthday: '1990-03-15', color: '#F59E0B', lastNote: 'تحب القهوة الصباحية' },
  { id: 'wfm2', name: 'حمودي', relation: 'ابن', emoji: '👦', birthday: '2015-07-22', color: '#3B82F6', lastNote: 'الصف الرابع — يحب الرياضيات' },
  { id: 'wfm3', name: 'ليان', relation: 'ابنة', emoji: '👧', birthday: '2018-11-08', color: '#EC4899', lastNote: 'تحب الرسم والألوان' },
  { id: 'wfm4', name: 'الوالد', relation: 'أب', emoji: '👴', birthday: '1960-05-20', color: '#6B7280', lastNote: 'متابعة الضغط والسكر' },
  { id: 'wfm5', name: 'الوالدة', relation: 'أم', emoji: '👵', birthday: '1963-09-10', color: '#8B5CF6', lastNote: 'موعد طبيب الأسبوع القادم' },
];
const W2_FAMILY_EVENTS = [
  { id: 'wfe1', title: 'عيد ميلاد حمودي', date: '2026-07-22', time: '06:00 م', location: 'المنزل', type: 'birthday', memberColor: '#3B82F6', emoji: '🎂' },
  { id: 'wfe2', title: 'تخرج ابن أخي', date: '2026-04-25', time: '05:00 م', location: 'جامعة الملك سعود', type: 'celebration', memberColor: '#10B981', emoji: '🎓' },
  { id: 'wfe3', title: 'موعد طبيب أسنان ليان', date: '2026-04-14', time: '10:00 ص', location: 'عيادة الابتسامة', type: 'medical', memberColor: '#EC4899', emoji: '🦷' },
  { id: 'wfe4', title: 'رحلة عائلية للبحر', date: '2026-04-18', time: '04:00 م', location: 'شاطئ نصف القمر', type: 'trip', memberColor: '#06B6D4', emoji: '🏖️' },
  { id: 'wfe5', title: 'اجتماع مدرسة حمودي', date: '2026-04-22', time: '09:00 ص', location: 'مدرسة الرواد', type: 'meeting', memberColor: '#3B82F6', emoji: '🏫' },
  { id: 'wfe6', title: 'زيارة الوالدين', date: '2026-04-11', time: '07:00 م', location: 'بيت الوالدين', type: 'visit', memberColor: '#8B5CF6', emoji: '🏠' },
];
const W2_FAMILY_TASKS = [
  { id: 'wft1', title: 'تجديد تأمين السيارة', assignee: 'غازي', status: 'pending', priority: 'high', dueDate: '2026-04-15', category: 'admin' },
  { id: 'wft2', title: 'حجز رحلة الصيف', assignee: 'غازي + أم حمود', status: 'pending', priority: 'medium', dueDate: '2026-05-01', category: 'travel' },
  { id: 'wft3', title: 'شراء لابتوب حمودي', assignee: 'غازي', status: 'done', priority: 'high', dueDate: '2026-04-01', category: 'shopping' },
  { id: 'wft4', title: 'فحص طبي دوري للوالد', assignee: 'غازي', status: 'pending', priority: 'high', dueDate: '2026-04-20', category: 'health' },
  { id: 'wft5', title: 'تسجيل ليان في نادي رسم', assignee: 'أم حمود', status: 'pending', priority: 'low', dueDate: '2026-05-15', category: 'education' },
  { id: 'wft6', title: 'صيانة المكيفات', assignee: 'غازي', status: 'done', priority: 'medium', dueDate: '2026-03-30', category: 'home' },
  { id: 'wft7', title: 'تجديد جواز سفر الزوجة', assignee: 'أم حمود', status: 'pending', priority: 'medium', dueDate: '2026-06-01', category: 'admin' },
];

// ═══════════════════════════════════════
// DATA — الصحة
// ═══════════════════════════════════════
const W2_HABITS = [
  { id: 'h1', name: 'رياضة', icon: '🏃', target: 5, color: '#10B981' },
  { id: 'h2', name: 'ماء 8 أكواب', icon: '💧', target: 7, color: '#3B82F6' },
  { id: 'h3', name: 'نوم مبكر', icon: '😴', target: 6, color: '#8B5CF6' },
  { id: 'h4', name: 'فيتامينات', icon: '💊', target: 7, color: '#F59E0B' },
  { id: 'h5', name: 'مشي 10K', icon: '🚶', target: 5, color: '#06B6D4' },
  { id: 'h6', name: 'تأمل', icon: '🧘', target: 4, color: '#EC4899' },
  { id: 'h7', name: 'قراءة 30د', icon: '📚', target: 7, color: '#F97316' },
];
const HABIT_PATTERNS: Record<string, number[]> = {
  h1: [1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0],
  h2: [1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1],
  h3: [1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
  h4: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  h5: [0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0],
  h6: [1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0],
  h7: [1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0],
};
function buildHabitLog() {
  const log: Record<string, Record<string, boolean>> = {};
  const today = new Date();
  for (let daysAgo = 27; daysAgo >= 0; daysAgo--) {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    log[dateStr] = {};
    Object.keys(HABIT_PATTERNS).forEach((hid) => {
      log[dateStr][hid] = HABIT_PATTERNS[hid][27 - daysAgo] === 1;
    });
  }
  return log;
}
const W2_HABIT_LOG = buildHabitLog();

const W2_APPOINTMENTS = [
  { id: 'a1', doctor: 'د. خالد العمري', specialty: 'أسنان', date: '2026-04-10', time: '10:00 ص', hospital: 'مستشفى المملكة', status: 'upcoming', color: '#3B82F6', icon: '🦷' },
  { id: 'a2', doctor: 'د. سارة الحربي', specialty: 'جلدية', date: '2026-04-15', time: '02:00 م', hospital: 'عيادات ديرما', status: 'upcoming', color: '#EC4899', icon: '🏥' },
  { id: 'a3', doctor: 'د. فهد الشمري', specialty: 'عيون', date: '2026-03-28', time: '11:00 ص', hospital: 'مستشفى العيون', status: 'completed', color: '#10B981', icon: '👁️' },
  { id: 'a4', doctor: 'د. نورة القحطاني', specialty: 'باطنية', date: '2026-04-22', time: '09:30 ص', hospital: 'مستشفى الحبيب', status: 'upcoming', color: '#F59E0B', icon: '🩺' },
  { id: 'a5', doctor: 'د. محمد الغامدي', specialty: 'قلب', date: '2026-05-05', time: '11:00 ص', hospital: 'مستشفى الملك فيصل', status: 'upcoming', color: '#EF4444', icon: '❤️' },
];

// ═══════════════════════════════════════
// DATA — التطوير الشخصي
// ═══════════════════════════════════════
const W2_LEARNING = [
  { id: 'l1', title: 'Next.js 15 Mastery', type: 'course', author: 'Vercel Team', status: 'active', progress: 65, tags: ['برمجة', 'Next.js'], notes: 'الفصل 12', emoji: '⚛️', rating: 5 },
  { id: 'l2', title: 'React Advanced Patterns', type: 'course', author: 'Kent C. Dodds', status: 'active', progress: 40, tags: ['برمجة', 'React'], notes: 'Section 4', emoji: '⚛️', rating: 4 },
  { id: 'l3', title: 'Zero to One', type: 'book', author: 'Peter Thiel', status: 'done', progress: 100, tags: ['ريادة', 'استراتيجية'], notes: 'ممتاز — فكرة الاحتكار', emoji: '🚀', rating: 5 },
  { id: 'l4', title: 'بودكاست ثمانية', type: 'podcast', author: 'ثمانية', status: 'backlog', progress: 0, tags: ['ثقافة'], notes: '', emoji: '🎙️', rating: 0 },
  { id: 'l5', title: 'UI/UX Masterclass', type: 'course', author: 'Gary Simon', status: 'backlog', progress: 0, tags: ['تصميم', 'UX'], notes: 'مهم للمشاريع', emoji: '🎨', rating: 0 },
  { id: 'l6', title: 'Deep Work', type: 'book', author: 'Cal Newport', status: 'active', progress: 30, tags: ['إنتاجية', 'تركيز'], notes: 'الفصل 3', emoji: '🧠', rating: 4 },
  { id: 'l7', title: 'Python for Data Science', type: 'course', author: 'Coursera', status: 'done', progress: 100, tags: ['برمجة', 'بيانات'], notes: 'حصلت على الشهادة', emoji: '🐍', rating: 4 },
  { id: 'l8', title: 'بودكاست فنجان', type: 'podcast', author: 'عبدالرحمن أبومالح', status: 'active', progress: 50, tags: ['ثقافة', 'ريادة'], notes: 'حلقة ماسك رائعة', emoji: '☕', rating: 5 },
  { id: 'l9', title: 'The Psychology of Money', type: 'book', author: 'Morgan Housel', status: 'done', progress: 100, tags: ['مال', 'تفكير'], notes: 'غير نظرتي للمال', emoji: '💰', rating: 5 },
  { id: 'l10', title: 'The Lean Startup', type: 'book', author: 'Eric Ries', status: 'backlog', progress: 0, tags: ['ريادة'], notes: '', emoji: '📊', rating: 0 },
];
const W2_IDEAS = [
  { id: 'i1', title: 'تطبيق تتبع عادات العائلة', desc: 'تطبيق يجمع عادات كل أفراد العائلة في لوحة واحدة مع نقاط تحفيزية', tags: ['تطبيق', 'عائلة'], status: 'active', priority: 'high', color: '#3B82F6', date: '2026-03-15' },
  { id: 'i2', title: 'كورس Supabase بالعربي', desc: 'محتوى تعليمي كامل عن Supabase للمطورين العرب — يوتيوب + مدونة', tags: ['تعليم', 'محتوى'], status: 'active', priority: 'medium', color: '#10B981', date: '2026-03-20' },
  { id: 'i3', title: 'CRM بسيط للبراندات الصغيرة', desc: 'CRM مبسط يناسب رواد الأعمال السعوديين بدون تعقيد', tags: ['SaaS', 'CRM'], status: 'backlog', priority: 'high', color: '#8B5CF6', date: '2026-03-25' },
  { id: 'i4', title: 'قراءة 24 كتاب في 2026', desc: 'كتابان شهرياً — كتاب تطوير ذات + كتاب أعمال', tags: ['قراءة', 'هدف'], status: 'active', priority: 'medium', color: '#F59E0B', date: '2026-01-01' },
  { id: 'i5', title: 'إطلاق نيوزليتر أسبوعي', desc: 'نيوزليتر عن التقنية والأعمال للجمهور العربي — Substack', tags: ['محتوى', 'كتابة'], status: 'backlog', priority: 'medium', color: '#F97316', date: '2026-04-01' },
  { id: 'i6', title: 'بناء شبكة علاقات مهنية', desc: 'التواصل مع 5 أشخاص جدد شهرياً في مجال التقنية', tags: ['شبكة', 'علاقات'], status: 'backlog', priority: 'low', color: '#EC4899', date: '2026-03-01' },
];

// ═══════════════════════════════════════
// DATA — المالي
// ═══════════════════════════════════════
const W2_ACCOUNTS = [
  { id: 'a1', name: 'الراجحي — جاري', balance: 42500, type: 'bank', bank: 'بنك الراجحي', color: '#3B82F6', icon: '🏦' },
  { id: 'a2', name: 'الأهلي — ادخار', balance: 85000, type: 'savings', bank: 'البنك الأهلي', color: '#10B981', icon: '💰' },
  { id: 'a3', name: 'محفظة STC Pay', balance: 1250, type: 'wallet', bank: 'STC Pay', color: '#8B5CF6', icon: '📱' },
  { id: 'a4', name: 'بطاقة ائتمان', balance: -3200, type: 'credit', bank: 'الراجحي', color: '#EF4444', icon: '💳' },
  { id: 'a5', name: 'صندوق الطوارئ', balance: 30000, type: 'savings', bank: 'الأهلي', color: '#F59E0B', icon: '🛡️' },
];
const W2_TRANSACTIONS = [
  { id: 't1', desc: 'راتب شهري', amount: 25000, type: 'income', cat: 'salary', date: '2026-04-01', icon: '💼' },
  { id: 't2', desc: 'إيجار الشقة', amount: 5000, type: 'expense', cat: 'rent', date: '2026-04-01', icon: '🏠' },
  { id: 't3', desc: 'مقاضي كارفور', amount: 1200, type: 'expense', cat: 'groceries', date: '2026-04-03', icon: '🛒' },
  { id: 't4', desc: 'بنزين', amount: 300, type: 'expense', cat: 'transport', date: '2026-04-04', icon: '⛽' },
  { id: 't5', desc: 'Netflix + Spotify', amount: 120, type: 'expense', cat: 'entertainment', date: '2026-04-05', icon: '🎬' },
  { id: 't6', desc: 'أرباح متجر سلة', amount: 8500, type: 'income', cat: 'business', date: '2026-04-03', icon: '📦' },
  { id: 't7', desc: 'فاتورة كهرباء + ماء', amount: 650, type: 'expense', cat: 'bills', date: '2026-04-06', icon: '📄' },
  { id: 't8', desc: 'عشاء عائلي', amount: 380, type: 'expense', cat: 'food', date: '2026-04-06', icon: '🍽️' },
  { id: 't9', desc: 'ملابس أطفال', amount: 650, type: 'expense', cat: 'shopping', date: '2026-04-05', icon: '🛍️' },
  { id: 't10', desc: 'استشارة تسويقية', amount: 3000, type: 'income', cat: 'freelance', date: '2026-04-02', icon: '💻' },
  { id: 't11', desc: 'Notion + Figma', amount: 200, type: 'expense', cat: 'software', date: '2026-04-07', icon: '💻' },
  { id: 't12', desc: 'هدية عيد ميلاد', amount: 500, type: 'expense', cat: 'gifts', date: '2026-04-02', icon: '🎁' },
];

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
const QUOTES = [
  { text: '"الانضباط هو الجسر بين الأهداف والإنجاز"', author: 'جيم رون' },
  { text: '"لا تنتظر الظروف المثالية — ابدأ الآن بما لديك"', author: 'آرثر أشي' },
  { text: '"كل يوم هو فرصة جديدة لتكون أفضل مما كنت عليه أمس"', author: 'مجهول' },
  { text: '"الوقت لا يعود — استثمر كل لحظة بحكمة"', author: 'مجهول' },
];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function w2FormatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}
function calcStreak() {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 28; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const log = W2_HABIT_LOG[ds];
    if (!log) break;
    const allDone = W2_HABITS.every((h) => log[h.id]);
    if (allDone) streak++;
    else break;
  }
  return streak;
}

// ═══════════════════════════════════════
// 1. ZEN TAB — خلاصة اليوم
// ═══════════════════════════════════════
function ZenTab({ onTabChange }: { onTabChange: (t: Tab) => void }) {
  const [time, setTime] = useState('');
  const [bgGrad, setBgGrad] = useState('');
  const [textCol, setTextCol] = useState('#fff');
  const [textMuted, setTextMuted] = useState('rgba(255,255,255,0.7)');
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [dayName, setDayName] = useState('');
  const [quote, setQuote] = useState(QUOTES[0]);

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
      setDayName(DAYS_AR[now.getDay()]);
      setDateStr(`${now.getDate()} ${MONTHS_AR[now.getMonth()]} ${now.getFullYear()}`);
      setQuote(QUOTES[now.getDate() % QUOTES.length]);
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = W2_HABIT_LOG[today] || {};
  const habitsToday = W2_HABITS.filter((h) => todayLog[h.id]).length;
  const healthPct = Math.round((habitsToday / W2_HABITS.length) * 100);
  const pendingFamily = W2_FAMILY_TASKS.filter((t) => t.status === 'pending').length;
  const nextEvent = W2_FAMILY_EVENTS.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const totalBalance = W2_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const activelearning = W2_LEARNING.filter((l) => l.status === 'active').length;
  const activeIdeas = W2_IDEAS.filter((i) => i.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero Card */}
      <div style={{ background: bgGrad, borderRadius: 24, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 140 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: textMuted, marginBottom: 6 }}>{greetingIcon} {greeting}، غازي</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: textCol, marginBottom: 10 }}>{dayName}، {dateStr}</div>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: textMuted, maxWidth: 320 }}>
            {quote.text}
            <span style={{ display: 'block', marginTop: 4, fontSize: 11 }}>— {quote.author}</span>
          </div>
        </div>
        <div style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 800, color: textCol, letterSpacing: 2 }}>{time}</div>
      </div>

      {/* Bento Grid — 4 بطاقات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {/* الصحة */}
        <div onClick={() => onTabChange('health')} style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all .2s', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>الصحة اليوم</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt)', lineHeight: 1 }}>{habitsToday}/{W2_HABITS.length}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>عادة مكتملة</div>
            <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: `${healthPct}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#10b981,#34d399)', transition: 'width .5s' }} />
            </div>
          </div>
        </div>
        {/* العائلة */}
        <div onClick={() => onTabChange('family')} style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all .2s' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👨‍👩‍👧‍👦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>العائلة</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt)', lineHeight: 1 }}>{pendingFamily}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>مهمة معلقة</div>
            {nextEvent && <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 8, padding: '4px 8px', background: 'var(--bg2)', borderRadius: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📅 {nextEvent.emoji} {nextEvent.title}</div>}
          </div>
        </div>
        {/* الثروة */}
        <div onClick={() => onTabChange('wealth')} style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all .2s' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💎</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>صافي الثروة</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', lineHeight: 1 }}>{totalBalance.toLocaleString('ar-SA')}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>ريال سعودي</div>
          </div>
        </div>
        {/* التطوير */}
        <div onClick={() => onTabChange('growth')} style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all .2s' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🚀</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>التطوير</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt)', lineHeight: 1 }}>{activelearning}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>قيد التعلم</div>
            <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 8, padding: '4px 8px', background: 'var(--bg2)', borderRadius: 6 }}>💡 {activeIdeas} أفكار نشطة</div>
          </div>
        </div>
      </div>

      {/* نبضات اليوم */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 14, margin: '0 0 14px' }}>⚡ نبضات اليوم</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {W2_FAMILY_EVENTS.slice(0, 4).map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.memberColor, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--txt2)' }}>{e.emoji} {e.title}</span>
              <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{w2FormatDate(e.date)}</span>
            </div>
          ))}
          {W2_TRANSACTIONS.slice(0, 2).map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.type === 'income' ? '#10b981' : '#ef4444', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--txt2)' }}>{t.icon} {t.desc}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.type === 'income' ? '#10b981' : '#ef4444' }}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('ar-SA')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 2. FAMILY TAB — العائلة
// ═══════════════════════════════════════
function FamilyTab() {
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = W2_FAMILY_EVENTS.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const doneTasks = W2_FAMILY_TASKS.filter((t) => t.status === 'done');
  const pct = Math.round((doneTasks.length / W2_FAMILY_TASKS.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>👨‍👩‍👧‍👦 العائلة</h2>
          <p style={{ fontSize: 13, color: 'var(--txt3)', margin: '4px 0 0' }}>أحبابك وأحداثهم ومهامهم</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 120, height: 6, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--txt2)' }}>{doneTasks.length}/{W2_FAMILY_TASKS.length} مهمة</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* أفراد العائلة */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, height: 'fit-content' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 16px' }}>👥 أفراد العائلة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {W2_FAMILY_MEMBERS.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--bg2)', border: `1px solid ${m.color}30` }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${m.color}20`, border: `2px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{m.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{m.relation}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.lastNote}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline + مهام */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* الأحداث القادمة */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>📅 الأحداث القادمة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--txt3)', textAlign: 'center', padding: 20 }}>لا أحداث قادمة 🎉</div>
              ) : upcomingEvents.map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--bg2)', borderRight: `3px solid ${e.memberColor}` }}>
                  <span style={{ fontSize: 20 }}>{e.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{e.time} — {e.location}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--txt3)', background: 'var(--bg)', padding: '3px 8px', borderRadius: 8, border: '1px solid var(--brd)' }}>{w2FormatDate(e.date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* مهام العائلة */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>✅ مهام العائلة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {W2_FAMILY_TASKS.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: t.status === 'done' ? 'rgba(16,185,129,0.05)' : 'var(--bg2)', opacity: t.status === 'done' ? 0.7 : 1 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, border: t.status === 'done' ? 'none' : '2px solid var(--brd)', background: t.status === 'done' ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>{t.status === 'done' && '✓'}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--txt)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{t.assignee}</span>
                  {t.priority === 'high' && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>عاجل</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 3. HEALTH TAB — الصحة
// ═══════════════════════════════════════
function HealthTab() {
  const [habitLog, setHabitLog] = useState<Record<string, Record<string, boolean>>>({ ...W2_HABIT_LOG });
  const today = new Date().toISOString().split('T')[0];
  const todayLog = habitLog[today] || {};

  const last7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push(d.toISOString().split('T')[0]);
  }
  const weekStats = W2_HABITS.map((h) => {
    const done = last7.filter((d) => habitLog[d] && habitLog[d][h.id]).length;
    return { habit: h, done, pct: Math.round((done / 7) * 100) };
  });
  const totalScore = Math.round(weekStats.reduce((s, ws) => s + ws.pct, 0) / weekStats.length);
  const streak = calcStreak();

  const last28: string[] = [];
  for (let j = 27; j >= 0; j--) {
    const d = new Date();
    d.setDate(d.getDate() - j);
    last28.push(d.toISOString().split('T')[0]);
  }

  function toggleHabit(hid: string) {
    setHabitLog((prev) => ({
      ...prev,
      [today]: { ...(prev[today] || {}), [hid]: !prev[today]?.[hid] },
    }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { icon: '💪', val: `${totalScore}%`, label: 'نقاط الصحة', bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
          { icon: '🔥', val: streak.toString(), label: 'يوم متواصل', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
          { icon: '🎯', val: `${weekStats.filter((ws) => ws.pct >= 70).length}/${W2_HABITS.length}`, label: 'عادة على المسار', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
          { icon: '📅', val: W2_APPOINTMENTS.filter((a) => a.status === 'upcoming').length.toString(), label: 'موعد قادم', bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' },
        ].map((k, i) => (
          <div key={i} style={{ borderRadius: 20, padding: 20, textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)', background: k.bg }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1d1d1f' }}>{k.val}</div>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 4, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Habit Matrix */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 16px' }}>📊 مصفوفة العادات — آخر 28 يوم</h3>
          <div style={{ overflowX: 'auto' }}>
            {W2_HABITS.map((h) => (
              <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '130px repeat(28,1fr)', gap: 3, marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--txt2)', paddingInlineEnd: 8 }}>
                  <span style={{ fontSize: 14 }}>{h.icon}</span>
                  <span>{h.name}</span>
                </div>
                {last28.map((ds) => {
                  const done = habitLog[ds]?.[h.id];
                  const isToday = ds === today;
                  return (
                    <div
                      key={ds}
                      onClick={() => ds === today && toggleHabit(h.id)}
                      style={{
                        aspectRatio: '1', borderRadius: 4,
                        background: done ? h.color : 'var(--bg2)',
                        opacity: done ? 1 : 0.3,
                        cursor: ds === today ? 'pointer' : 'default',
                        border: isToday ? '2px solid var(--gold)' : '1px solid transparent',
                        transition: 'all .15s',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* اليوم — العادات */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--brd)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 12px' }}>✅ عادات اليوم</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {W2_HABITS.map((h) => (
                <button key={h.id} onClick={() => toggleHabit(h.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
                    border: todayLog[h.id] ? `1px solid ${h.color}50` : '1px solid var(--brd)',
                    background: todayLog[h.id] ? `${h.color}10` : 'var(--bg2)',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', transition: 'all .15s',
                  }}>
                  <span style={{ fontSize: 20 }}>{h.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: todayLog[h.id] ? h.color : 'var(--txt)', textDecoration: todayLog[h.id] ? 'line-through' : 'none' }}>{h.name}</div>
                  </div>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${todayLog[h.id] ? h.color : 'var(--brd)'}`, background: todayLog[h.id] ? h.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>
                    {todayLog[h.id] && '✓'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — مواعيد طبية + أسبوعية */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>🏥 المواعيد الطبية</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {W2_APPOINTMENTS.map((a) => (
                <div key={a.id} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg2)', borderRight: `3px solid ${a.color}`, opacity: a.status === 'completed' ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{a.doctor}</span>
                    {a.status === 'completed' && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700 }}>مكتمل</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{a.specialty} — {a.hospital}</div>
                  <div style={{ fontSize: 11, color: a.color, fontWeight: 600, marginTop: 4 }}>{w2FormatDate(a.date)} — {a.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* إحصائيات أسبوعية */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>📈 أداء الأسبوع</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weekStats.map((ws) => (
                <div key={ws.habit.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--txt2)' }}>{ws.habit.icon} {ws.habit.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ws.habit.color }}>{ws.done}/7</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${ws.pct}%`, height: '100%', borderRadius: 4, background: ws.habit.color, transition: 'width .3s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 4. GROWTH TAB — التطوير الشخصي
// ═══════════════════════════════════════
function GrowthTab() {
  const cols = [
    { id: 'active', label: 'قيد التعلم', icon: '📖', color: '#3B82F6' },
    { id: 'done', label: 'مكتمل', icon: '✅', color: '#10B981' },
    { id: 'backlog', label: 'قائمة الانتظار', icon: '📋', color: '#8B5CF6' },
  ];
  const typeIcons: Record<string, string> = { book: '📚', course: '🎓', podcast: '🎙️' };
  const typeColors: Record<string, string> = { book: '#F59E0B', course: '#3B82F6', podcast: '#EC4899' };
  const typeLabels: Record<string, string> = { book: 'كتاب', course: 'دورة', podcast: 'بودكاست' };
  const statusColors: Record<string, string> = { active: '#10B981', backlog: '#8B5CF6' };

  const xpTotal = W2_LEARNING.filter((l) => l.status === 'done').length * 100
    + W2_LEARNING.filter((l) => l.status === 'active').reduce((s, l) => s + l.progress, 0)
    + W2_IDEAS.filter((i) => i.status === 'active').length * 25;
  const xpLevel = Math.floor(xpTotal / 200) + 1;
  const xpInLevel = xpTotal % 200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header + XP */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>🚀 التطوير الشخصي</h2>
          <p style={{ fontSize: 13, color: 'var(--txt3)', margin: '4px 0 0' }}>رحلة التعلم والأفكار والنمو المستمر</p>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 16, padding: '12px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 6 }}>المستوى {xpLevel}</div>
          <div style={{ width: 120, height: 6, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ width: `${Math.round((xpInLevel / 200) * 100)}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{xpTotal} XP</div>
        </div>
      </div>

      {/* Kanban التعلم */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 16px' }}>📚 مكتبة التعلم</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {cols.map((col) => {
            const items = W2_LEARNING.filter((l) => l.status === col.id);
            return (
              <div key={col.id} style={{ background: 'var(--bg2)', borderRadius: 16, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: `2px solid ${col.color}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{col.icon} {col.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${col.color}20`, color: col.color }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 12, padding: 12, transition: 'all .2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${typeColors[item.type]}15`, color: typeColors[item.type] }}>{typeIcons[item.type]} {typeLabels[item.type]}</span>
                        {item.rating > 0 && <span style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 1 }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 3 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>{item.author}</div>
                      {item.progress > 0 && (
                        <>
                          <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden', marginBottom: 2 }}>
                            <div style={{ width: `${item.progress}%`, height: '100%', borderRadius: 4, background: col.color }} />
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--txt3)', textAlign: 'left' }}>{item.progress}%</div>
                        </>
                      )}
                      {item.notes && <div style={{ fontSize: 11, color: 'var(--txt2)', background: 'var(--bg2)', padding: '4px 8px', borderRadius: 6, marginTop: 4 }}>💬 {item.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* أفكاري */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>💡 أفكاري</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {W2_IDEAS.map((idea) => (
            <div key={idea.id} style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 16, padding: 16, borderTop: `3px solid ${idea.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${statusColors[idea.status]}15`, color: statusColors[idea.status] }}>{idea.status === 'active' ? '🔥 نشط' : '📋 انتظار'}</span>
                <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{w2FormatDate(idea.date)}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }}>{idea.title}</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 10, lineHeight: 1.5 }}>{idea.desc}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {idea.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${idea.color}15`, color: idea.color }}>#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 5. WEALTH TAB — المالي الشخصي
// ═══════════════════════════════════════
function WealthTab() {
  const totalBalance = W2_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const totalIncome = W2_TRANSACTIONS.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = W2_TRANSACTIONS.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingsRate = Math.round((savings / totalIncome) * 100);
  const healthScore = Math.min(100, Math.round((savings / totalIncome) * 100 + (totalBalance > 100000 ? 20 : 0)));

  const catTotals: Record<string, number> = {};
  W2_TRANSACTIONS.filter((t) => t.type === 'expense').forEach((t) => {
    catTotals[t.cat] = (catTotals[t.cat] || 0) + t.amount;
  });
  const catNames: Record<string, string> = { rent: 'إيجار', groceries: 'مقاضي', transport: 'مواصلات', entertainment: 'ترفيه', bills: 'فواتير', food: 'طعام', shopping: 'تسوق', software: 'برامج', gifts: 'هدايا' };
  const catColors: Record<string, string> = { rent: '#3B82F6', groceries: '#10B981', transport: '#F59E0B', entertainment: '#EC4899', bills: '#EF4444', food: '#F97316', shopping: '#8B5CF6', software: '#06B6D4', gifts: '#E11D48' };
  const catEntries = Object.keys(catTotals).map((k) => ({ cat: k, amount: catTotals[k] })).sort((a, b) => b.amount - a.amount);
  const maxBal = Math.max(...W2_ACCOUNTS.map((a) => Math.abs(a.balance)));
  const sortedTx = [...W2_TRANSACTIONS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>💎 المالي الشخصي</h2>
        <p style={{ fontSize: 13, color: 'var(--txt3)', margin: '4px 0 0' }}>ثروتك وحساباتك ومعاملاتك</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8 }}>💰 صافي الثروة</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: totalBalance > 0 ? '#10b981' : '#ef4444' }}>{totalBalance.toLocaleString('ar-SA')}</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>ريال سعودي</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8 }}>📈 الدخل الشهري</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>+{totalIncome.toLocaleString('ar-SA')}</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>ريال</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8 }}>📉 المصروفات</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>-{totalExpense.toLocaleString('ar-SA')}</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>ريال</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 8 }}>💰 الوفر</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: savings > 0 ? '#10b981' : '#ef4444' }}>{savings.toLocaleString('ar-SA')}</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>{savingsRate}% من الدخل</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* الحسابات */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>🏦 الحسابات</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {W2_ACCOUNTS.map((a) => {
                const pct = Math.round((Math.abs(a.balance) / maxBal) * 100);
                const isNeg = a.balance < 0;
                return (
                  <div key={a.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg2)', border: `1px solid ${a.color}20` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{a.bank}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: isNeg ? '#ef4444' : a.color }}>{isNeg ? '-' : ''}{Math.abs(a.balance).toLocaleString('ar-SA')} ر.س</div>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: isNeg ? '#ef4444' : a.color, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* توزيع الإنفاق */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>📊 توزيع الإنفاق</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {catEntries.map((e) => {
                const pct = Math.round((e.amount / totalExpense) * 100);
                const color = catColors[e.cat] || '#888';
                return (
                  <div key={e.cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--txt2)', width: 60, flexShrink: 0 }}>{catNames[e.cat] || e.cat}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color, width: 30, textAlign: 'left', flexShrink: 0 }}>{pct}%</span>
                    <span style={{ fontSize: 11, color: 'var(--txt3)', width: 60, textAlign: 'left', flexShrink: 0 }}>{e.amount.toLocaleString('ar-SA')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* المعاملات */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 20, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', margin: '0 0 14px' }}>📋 المعاملات</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedTx.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--bg2)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{w2FormatDate(t.date)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('ar-SA')} ر.س
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'zen', label: 'خلاصة اليوم', icon: '🌅' },
  { id: 'family', label: 'العائلة', icon: '👨‍👩‍👧‍👦' },
  { id: 'health', label: 'الصحة', icon: '💚' },
  { id: 'growth', label: 'التطوير', icon: '🚀' },
  { id: 'wealth', label: 'المالي', icon: '💎' },
];

export default function WorldsClient() {
  const [activeTab, setActiveTab] = useState<Tab>('zen');
  return (
    <div className="scr on">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg2)', borderRadius: 14, padding: 5, width: 'fit-content', border: '1px solid var(--brd)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 10, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
              border: 'none', transition: 'all .15s',
              background: activeTab === t.id ? 'var(--gold-dim)' : 'transparent',
              color: activeTab === t.id ? 'var(--gold)' : 'var(--txt3)',
              fontWeight: activeTab === t.id ? 700 : 400,
            }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      {/* Content */}
      <div>
        {activeTab === 'zen' && <ZenTab onTabChange={setActiveTab} />}
        {activeTab === 'family' && <FamilyTab />}
        {activeTab === 'health' && <HealthTab />}
        {activeTab === 'growth' && <GrowthTab />}
        {activeTab === 'wealth' && <WealthTab />}
      </div>
    </div>
  );
}
