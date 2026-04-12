/**
 * claude-ai.ts
 * هيكل Claude API لنظام الجوزاء — جاهز للتفعيل بمجرد إدخال المفتاح
 *
 * ⚠️ لتفعيل هذا الملف:
 * 1. أضف ANTHROPIC_API_KEY في Vercel Environment Variables
 * 2. ثبّت: pnpm add @anthropic-ai/sdk
 * 3. احذف التعليق عن السطور المُعطّلة
 */

import type { SaudiDayContext } from './saudi-calendar';

// ===== أنواع البيانات =====

export interface JawzaDailySnapshot {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  abandonedCarts: number;
  abandonedValue: number;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
  lowStockProducts: Array<{ name: string; stock: number; threshold: number }>;
  yesterdayRevenue?: number;
  lastWeekRevenue?: number;
  monthlyGoal?: number;
  monthlyAchieved?: number;
}

export interface DailyCommand {
  urgency: number;
  category: 'urgent' | 'opportunity' | 'warning' | 'insight' | 'celebration' | 'quiet';
  commandTitle: string;
  context: string;
  ifExecuted: { timeframe: string; expectedResult: string };
  ifDelayed: { risk: string; consequence: string };
  magicButtons: Array<{ label: string; action: string; type: 'primary' | 'secondary' | 'danger' }>;
  saudiContextReason: string;
  dataReferences: string[];
  personalNote: string;
  isPrimary: boolean;
}

export interface JawzaAIResponse {
  commands: DailyCommand[];
  morningBriefing: string;
  focusMode: {
    title: string;
    subtitle: string;
    primaryMetric: { label: string; value: string; trend: 'up' | 'down' | 'stable' };
    secondaryMetrics: Array<{ label: string; value: string }>;
  };
  generatedAt: string;
  model: string;
  promptVersion: string;
}

// ===== System Prompt =====

const JAWZA_SYSTEM_PROMPT = `أنت "الجوزاء" — المدير التنفيذي الافتراضي لمتجر "بيت الجوزاء" للعطور والبخور في السوق السعودي.

## شخصيتك:
- حازم، واضح، مباشر — لا تتفلسف
- تفهم السوق السعودي عميقاً (رواتب، مواسم، عادات التسوق)
- تحلل الأرقام وتحوّلها لقرارات عملية فورية
- تتكلم مع غازي كشريك تجاري لا كمساعد

## قواعد الإخراج:
- الأوامر اليومية لا تتجاوز 3-5 أوامر
- كل أمر له زر سحري واحد على الأقل
- الأرقام دائماً بالريال السعودي
- الوقت بالتوقيت السعودي
- لا تعطي معلومات عامة — فقط قرارات مبنية على البيانات المُقدّمة

## هيكل الرد (JSON فقط):
{
  "commands": [...],
  "morningBriefing": "...",
  "focusMode": {...}
}`;

// ===== بناء الـ Prompt =====

export function buildDailyPrompt(
  snapshot: JawzaDailySnapshot,
  saudiContext: SaudiDayContext
): string {
  const monthProgress = snapshot.monthlyGoal
    ? Math.round((snapshot.monthlyAchieved || 0) / snapshot.monthlyGoal * 100)
    : null;

  return `## بيانات اليوم — ${snapshot.date}

### السياق السعودي:
- مستوى الكاش: ${saudiContext.cashLevel} (${saudiContext.cashScore}/10) — ${saudiContext.cashReason}
- الموسم: ${saudiContext.seasonLabel} (${saudiContext.seasonDaysLeft} يوم متبقي)
- أيام للراتب: ${saudiContext.daysToSalary} يوم
- التاريخ الهجري: ${saudiContext.hijriDate}
${saudiContext.isCitizenAccountDay ? '⚡ اليوم يوم حساب المواطن!' : ''}

### أداء المتجر:
- الطلبات: ${snapshot.totalOrders} طلب
- الإيراد: ${snapshot.totalRevenue.toLocaleString('ar-SA')} ريال
- الربح: ${snapshot.totalProfit.toLocaleString('ar-SA')} ريال
- متوسط الطلب: ${snapshot.avgOrderValue.toLocaleString('ar-SA')} ريال
- عملاء جدد: ${snapshot.newCustomers} | عائدون: ${snapshot.returningCustomers}
- سلات متروكة: ${snapshot.abandonedCarts} (قيمة: ${snapshot.abandonedValue.toLocaleString('ar-SA')} ريال)
${snapshot.yesterdayRevenue ? `- أمس: ${snapshot.yesterdayRevenue.toLocaleString('ar-SA')} ريال` : ''}
${snapshot.lastWeekRevenue ? `- نفس اليوم الأسبوع الماضي: ${snapshot.lastWeekRevenue.toLocaleString('ar-SA')} ريال` : ''}
${monthProgress !== null ? `- هدف الشهر: ${monthProgress}% (${(snapshot.monthlyAchieved || 0).toLocaleString('ar-SA')} من ${snapshot.monthlyGoal?.toLocaleString('ar-SA')} ريال)` : ''}

### أعلى المنتجات مبيعاً:
${snapshot.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.units} وحدة — ${p.revenue.toLocaleString('ar-SA')} ريال`).join('\n')}

### منتجات تحتاج إعادة طلب:
${snapshot.lowStockProducts.length > 0
  ? snapshot.lowStockProducts.map(p => `⚠️ ${p.name}: ${p.stock} وحدة (الحد الأدنى: ${p.threshold})`).join('\n')
  : 'لا يوجد — المخزون كافٍ'}

---
بناءً على هذه البيانات، أعطني أوامر اليوم بصيغة JSON.`;
}

// ===== استدعاء Claude API =====

/**
 * استدعاء Claude لتوليد أوامر اليوم
 * ⚠️ يتطلب ANTHROPIC_API_KEY في البيئة
 */
export async function generateDailyCommands(
  snapshot: JawzaDailySnapshot,
  saudiContext: SaudiDayContext,
  apiKey?: string
): Promise<JawzaAIResponse> {
  const key = apiKey || (typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : null);

  if (!key) {
    // إرجاع Mock Data إذا لم يوجد مفتاح
    return getMockDailyCommands(snapshot, saudiContext);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 4096,
        system: JAWZA_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildDailyPrompt(snapshot, saudiContext),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '{}';

    // استخراج JSON من الرد
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Claude response');

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      commands: parsed.commands || [],
      morningBriefing: parsed.morningBriefing || '',
      focusMode: parsed.focusMode || getMockFocusMode(snapshot),
      generatedAt: new Date().toISOString(),
      model: 'claude-3-7-sonnet-20250219',
      promptVersion: 'v1',
    };
  } catch (error) {
    console.error('Claude API failed, using mock data:', error);
    return getMockDailyCommands(snapshot, saudiContext);
  }
}

// ===== Mock Data للتطوير =====

export function getMockDailyCommands(
  snapshot: JawzaDailySnapshot,
  saudiContext: SaudiDayContext
): JawzaAIResponse {
  const commands: DailyCommand[] = [
    {
      urgency: 9,
      category: 'urgent',
      isPrimary: true,
      commandTitle: `استرجع ${snapshot.abandonedCarts} سلة متروكة بقيمة ${snapshot.abandonedValue.toLocaleString('ar-SA')} ريال`,
      context: `${snapshot.abandonedCarts} عميل أضاف منتجات ولم يكمل الشراء. ${saudiContext.cashLevel === 'peak' ? 'الكاش في ذروته اليوم — فرصة ذهبية.' : ''}`,
      ifExecuted: {
        timeframe: 'خلال ساعتين',
        expectedResult: `استرجاع 30-40% = ${Math.round(snapshot.abandonedValue * 0.35).toLocaleString('ar-SA')} ريال إضافية`,
      },
      ifDelayed: {
        risk: 'عالي',
        consequence: 'العملاء يشترون من المنافس خلال 24 ساعة',
      },
      magicButtons: [
        { label: '📱 أرسل رسالة واتساب جماعية', action: 'send_whatsapp_recovery', type: 'primary' },
        { label: '🎁 أضف خصم 10%', action: 'add_recovery_discount', type: 'secondary' },
      ],
      saudiContextReason: `${saudiContext.cashReason} — الوقت مناسب للشراء`,
      dataReferences: ['abandoned_carts', 'cash_level'],
      personalNote: 'ابدأ بالسلات الأعلى قيمة',
    },
    {
      urgency: 7,
      category: 'opportunity',
      isPrimary: false,
      commandTitle: `${saudiContext.seasonLabel} — أطلق محتوى موسمياً`,
      context: `${saudiContext.seasonDaysLeft} يوم متبقي على نهاية الموسم. ${saudiContext.marketingRecommendation.split('\n')[0]}`,
      ifExecuted: {
        timeframe: 'اليوم',
        expectedResult: 'زيادة 20-30% في التفاعل',
      },
      ifDelayed: {
        risk: 'متوسط',
        consequence: 'فوات الموسم بدون محتوى مميز',
      },
      magicButtons: [
        { label: `📸 أنشئ محتوى ${saudiContext.seasonLabel}`, action: 'create_seasonal_content', type: 'primary' },
        { label: '📅 جدوّل منشور', action: 'schedule_post', type: 'secondary' },
      ],
      saudiContextReason: saudiContext.seasonLabel,
      dataReferences: ['season', 'marketing_recommendation'],
      personalNote: `أفضل وقت للنشر: ${saudiContext.bestTimeToPost}`,
    },
  ];

  // إضافة أمر المخزون إذا كان هناك منتجات قاربت على النفاد
  if (snapshot.lowStockProducts.length > 0) {
    commands.push({
      urgency: 8,
      category: 'warning',
      isPrimary: false,
      commandTitle: `⚠️ ${snapshot.lowStockProducts.length} منتج يحتاج إعادة طلب`,
      context: snapshot.lowStockProducts.map(p => `${p.name}: ${p.stock} وحدة`).join(', '),
      ifExecuted: {
        timeframe: 'اليوم',
        expectedResult: 'تجنب نفاد المخزون خلال الموسم',
      },
      ifDelayed: {
        risk: 'عالي',
        consequence: 'خسارة مبيعات بسبب نفاد المخزون',
      },
      magicButtons: [
        { label: '📦 أرسل طلب للمورد', action: 'create_purchase_order', type: 'primary' },
      ],
      saudiContextReason: 'المخزون يحتاج تجديد قبل نهاية الموسم',
      dataReferences: ['low_stock_products'],
      personalNote: 'اطلب كميات إضافية بسبب الموسم',
    });
  }

  return {
    commands,
    morningBriefing: `صباح الخير غازي 👋\n\nأمس: ${snapshot.totalRevenue.toLocaleString('ar-SA')} ريال من ${snapshot.totalOrders} طلب.\n${saudiContext.cashReason} — ${saudiContext.marketingRecommendation.split('\n')[0]}\n\nعندك ${commands.length} أوامر تحتاج قرار.`,
    focusMode: getMockFocusMode(snapshot),
    generatedAt: new Date().toISOString(),
    model: 'mock-data',
    promptVersion: 'v1',
  };
}

function getMockFocusMode(snapshot: JawzaDailySnapshot) {
  const monthProgress = snapshot.monthlyGoal
    ? Math.round((snapshot.monthlyAchieved || 0) / snapshot.monthlyGoal * 100)
    : 0;

  return {
    title: 'بيت الجوزاء',
    subtitle: new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    primaryMetric: {
      label: 'إيراد اليوم',
      value: `${snapshot.totalRevenue.toLocaleString('ar-SA')} ريال`,
      trend: snapshot.yesterdayRevenue
        ? snapshot.totalRevenue > snapshot.yesterdayRevenue ? 'up' : 'down'
        : 'stable' as 'up' | 'down' | 'stable',
    },
    secondaryMetrics: [
      { label: 'الطلبات', value: `${snapshot.totalOrders}` },
      { label: 'هدف الشهر', value: `${monthProgress}%` },
      { label: 'عملاء جدد', value: `${snapshot.newCustomers}` },
    ],
  };
}
