# 🌿 الجوزاء — المدير التنفيذي الافتراضي
## نظام ذكاء اصطناعي لإدارة متجر بيت الجوزاء

---

## ✅ ما تم بناؤه

### قاعدة البيانات (Supabase) — 10 جداول جديدة

| الجدول | الوصف |
|--------|-------|
| `jawza_products` | كتالوج المنتجات مع بيانات المخزون والمورد |
| `jawza_sales_daily` | ملخص المبيعات اليومي |
| `jawza_product_metrics` | أداء كل منتج يومياً |
| `jawza_customers` | قاعدة العملاء مع التصنيف (VIP، معرض للخطر، إلخ) |
| `jawza_daily_commands` | الأوامر اليومية المولّدة بالذكاء الاصطناعي |
| `jawza_saudi_context` | السياق السعودي اليومي (كاش، موسم، راتب) |
| `jawza_abandoned_carts` | السلات المتروكة وحالة الاسترجاع |
| `jawza_sync_log` | سجل مزامنة سلة |
| `jawza_monthly_goals` | الأهداف الشهرية (2026 مُعبّأة مسبقاً) |
| `jawza_alerts` | التنبيهات والإشعارات |

---

### مكتبات الكود (lib/)

#### `saudi-calendar.ts`
حساب السياق السعودي الكامل لأي يوم:
- مستوى الكاش (peak/high/normal/low) بناءً على يوم الراتب وحساب المواطن
- اكتشاف الموسم تلقائياً (رمضان، عيد، يوم وطني، إلخ)
- توصيات تسويقية وأفضل وقت للنشر
- تحويل التاريخ الميلادي إلى هجري

```typescript
import { getSaudiDayContext } from './lib/saudi-calendar';
const ctx = getSaudiDayContext();
console.log(ctx.cashLevel);    // 'peak'
console.log(ctx.seasonLabel);  // 'رمضان المبارك'
console.log(ctx.bestTimeToPost); // '7-9 مساءً'
```

#### `claude-ai.ts`
هيكل Claude API جاهز للتفعيل:
- System Prompt متخصص لبيت الجوزاء
- بناء الـ Prompt من البيانات الحية
- Mock Data للتطوير بدون API key
- يعمل فوراً بعد إضافة `ANTHROPIC_API_KEY`

#### `salla-api.ts`
هيكل Salla API جاهز للتفعيل:
- جلب الطلبات، المنتجات، العملاء، السلات المتروكة
- تجديد الـ Token تلقائياً
- Mock Data للتطوير بدون OAuth
- OAuth Helper لربط المتجر

---

### الواجهة (components/)

#### `FocusMode.html` — وضع التركيز الصباحي
- المقياس الرئيسي (إيراد اليوم)
- مؤشر الكاش السعودي
- الإحاطة الصباحية
- زر الانتقال للأوامر

#### `CommandsPanel.html` — بطاقات الأوامر
- بطاقة لكل أمر مع مستوى الأولوية
- قسم "لو نفّذت / لو تأخرت"
- الأزرار السحرية
- تجاهل / تأجيل الأوامر

---

## 🔧 خطوات التفعيل

### 1. ربط متجر سلة (Salla OAuth)

1. اذهب إلى [salla.partners](https://salla.partners/) وأنشئ تطبيقاً جديداً
2. أضف في Vercel Environment Variables:
   ```
   SALLA_CLIENT_ID=xxx
   SALLA_CLIENT_SECRET=xxx
   ```
3. شغّل OAuth flow وأضف:
   ```
   SALLA_ACCESS_TOKEN=xxx
   SALLA_REFRESH_TOKEN=xxx
   ```
4. في `salla-api.ts` غيّر `MOCK_MODE = false`

### 2. تفعيل Claude AI

1. احصل على API key من [console.anthropic.com](https://console.anthropic.com/)
2. أضف في Vercel:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxx
   ```
3. الكود يكتشف المفتاح تلقائياً ويتوقف عن استخدام Mock Data

### 3. جدولة الأوامر اليومية

أضف Vercel Cron Job في `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/jawza/generate-daily-commands",
    "schedule": "0 5 * * *"
  }]
}
```
يعمل كل يوم الساعة 8 صباحاً (توقيت السعودية = UTC+3).

---

## 📁 هيكل الملفات

```
jawza/
├── README.md                    ← هذا الملف
├── db/
│   └── migrations/
│       └── 001_jawza_schema.sql ← SQL لإنشاء الجداول (مُنفّذ ✅)
├── lib/
│   ├── saudi-calendar.ts        ← حساب السياق السعودي ✅
│   ├── claude-ai.ts             ← هيكل Claude API ✅
│   └── salla-api.ts             ← هيكل Salla API ✅
└── components/
    ├── FocusMode.html           ← وضع التركيز الصباحي ✅
    └── CommandsPanel.html       ← بطاقات الأوامر ✅
```

---

## 🔒 أمان الفرع

هذا الكود على فرع `feature/jawza-virtual-ceo` فقط.
**لا تدمجه مع main إلا بعد:**
- [ ] اختبار الواجهة على Vercel Preview
- [ ] ربط سلة والتحقق من البيانات
- [ ] تفعيل Claude وتجربة الأوامر
- [ ] موافقة غازي على الدمج
