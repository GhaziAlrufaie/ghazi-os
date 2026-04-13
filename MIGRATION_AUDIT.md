# تقرير فحص النقل — Ghazi OS Migration Audit
**تاريخ التقرير:** 13 أبريل 2026  
**المُعِد:** Manus AI  
**الهدف:** توثيق شامل لـ `index.html` تمهيداً للنقل إلى Next.js 15

---

## 1. نظرة عامة على النظام

Ghazi OS هو نظام إدارة أعمال شخصي متكامل مبني بـ **Vanilla HTML + CSS + JavaScript** في ملف واحد بحجم **13,706 سطر** و**709 كيلوبايت**. يعمل كـ Single Page Application (SPA) بدون أي Framework، ويتصل بـ Supabase كقاعدة بيانات سحابية.

| المعلومة | القيمة |
|---------|--------|
| حجم الملف | 709,631 بايت (~693 KB) |
| عدد الأسطر | 13,706 سطر |
| عدد الدوال | 552 دالة |
| عدد الأقسام | 17 قسم (screen) |
| عدد جداول Supabase | 17 جدول |
| الخط | IBM Plex Sans Arabic |
| الاتجاه | RTL كامل |
| اللون الرئيسي | ذهبي `#C9A84C` |
| الخلفية | فاتحة `#FFFFFF` (بدون dark mode) |

---

## 2. الأقسام الموجودة (Screens)

### 2.1 القيادة — `s-cmd` (لوحة التحكم الرئيسية)
**الوظيفة:** الصفحة الرئيسية التي تظهر عند فتح النظام. تجمع أهم المعلومات في مكان واحد.

**المحتوى:**
- **Hero Section:** تحية شخصية مع التاريخ الهجري واليوم
- **بوصلة الأسبوع (Weekly Focus):** تحديد براند أو مشروع للتركيز عليه أسبوعياً مع عداد مبيعات اليوم
- **Inbox / الوارد:** مهام سريعة تُجلب من `inbox_tasks`
- **تنبيهات الإنتاج:** تحذيرات للبراندات التي تحتاج انتباهاً
- **مهام متأخرة:** عرض المهام المتأخرة عبر كل البراندات
- **قرارات معلقة:** القرارات التي تحتاج اتخاذ إجراء
- **تقويم مصغّر:** أحداث الأسبوع القادم
- **لوحة الموارد البشرية:** تنبيهات الرواتب والموظفين
- **مهام اليوم اليومية:** قائمة ثابتة (واتساب، سلة، إعلانات، إيميل)

**الدوال الرئيسية:** `renderCmd()`, `renderInboxList()`, `renderInboxSection()`, `initDashDrag()`, `toggleCmdSec()`, `wfRenderStickyBanner()`, `wfRenderWeekStrip()`

---

### 2.2 البراندات — `s-brands`
**الوظيفة:** عرض وإدارة جميع البراندات (العلامات التجارية).

**البراندات الحالية:**
- بيت الجوزاء (`b1`) — ذهبي
- أودريد (`b2`) — بنفسجي
- غازي بوتيك (`b3`) — أخضر
- ذكرني (`b4`) — أزرق

**المحتوى:** بطاقات البراندات مع صحة كل براند، مشاريعه، ومهامه.

**الدوال الرئيسية:** `renderBrands()`, `renderBrandDetail()`, `archiveBrand()`, `brandColor()`, `brandName()`

---

### 2.3 المهام — `s-tasks`
**الوظيفة:** إدارة مهام المشاريع عبر كل البراندات.

**المحتوى:**
- عرض Kanban أو List
- فلترة حسب البراند والحالة والأولوية
- بطاقات المهام مع: checklist، subtasks، روابط، مرفقات، أوصاف
- Drag & Drop بين الأعمدة

**حالات المهام:** `todo`, `in-progress`, `review`, `done`  
**الأولويات:** `critical`, `high`, `medium`, `low`

**الدوال الرئيسية:** `renderTasks()`, `renderTaskDetail()`, `renderProjectDetail()`, `renderSubtasks()`, `toggleTask()`, `focusChangeStatus()`

---

### 2.4 المبيعات — `s-sales`
**الوظيفة:** عرض بيانات مبيعات Salla مباشرة من قاعدة البيانات.

**المحتوى:**
- إجمالي المبيعات والطلبات
- قائمة الطلبات مع التفاصيل
- فلترة حسب الفترة الزمنية

**مصدر البيانات:** جدول `salla_orders` في Supabase (يُملأ عبر Salla Webhook)

**الدوال الرئيسية:** `renderSales()`, `loadSalesData()`, `wfGetTodaySales()`

---

### 2.5 الأرشيف — `s-archive`
**الوظيفة:** حفظ المهام والقرارات المكتملة أو الملغاة.

**المحتوى:** قائمة مؤرشفة مع إمكانية الاستعادة أو الحذف النهائي.

**الدوال الرئيسية:** `renderArchive()`, `archiveItem()`, `restoreItem()`, `deleteArchiveItem()`

---

### 2.6 القرارات — `s-decisions`
**الوظيفة:** تسجيل وتتبع القرارات التجارية والشخصية.

**المحتوى:**
- قرارات معلقة ومكتملة
- كل قرار له: سياق، خيارات، تأثير، موعد نهائي
- ربط القرار ببراند أو مشروع

**الدوال الرئيسية:** `renderDecisions()`, `openHRDecisionM()`, `doAddHRDecision()`, `applyHRDecision()`

---

### 2.7 التقويم — `s-calendar`
**الوظيفة:** تقويم شهري يعرض الأحداث والمهام.

**المحتوى:**
- تقويم ميلادي مع دعم هجري
- أحداث مرتبطة ببراندات
- التنقل بين الأشهر
- Month Picker

**الدوال الرئيسية:** `renderCalendar()`, `monthNav()`, `goToCurrentMonth()`, `toggleMonthPicker()`, `renderMonthPicker()`

---

### 2.8 الأداء — `s-performance`
**الوظيفة:** متابعة مؤشرات الأداء (KPIs) لكل براند.

**المحتوى:**
- مقاييس مخصصة لكل براند
- رسوم بيانية بسيطة
- فلترة حسب البراند

**الدوال الرئيسية:** `renderPerformance()`, `addMetricM()`, `doAddMetric()`

---

### 2.9 الشخصي — `s-personal`
**الوظيفة:** إدارة المهام والمشاريع الشخصية (غير المرتبطة بالبراندات).

**المحتوى:**
- Kanban شخصي بفئات مخصصة
- مهام شخصية مع نفس ميزات مهام البراندات
- ماليات شخصية (مصاريف)

**الدوال الرئيسية:** `renderPersonal()`, `buildPersonalFinanceHtml()`, `personalDragStart()`, `personalBoardDrop()`

---

### 2.10 عوالمي — `s-worlds`
**الوظيفة:** قسم الحياة الشخصية الشاملة، مقسّم إلى 5 عوالم.

**العوالم الخمسة:**
1. **الزن (Zen):** الروتين اليومي، نبضات اليوم
2. **العائلة:** أفراد العائلة، أحداثهم، مهامهم
3. **الصحة:** المواعيد الطبية، مصفوفة العادات (28 يوم)
4. **النمو:** مكتبة التعلم، أفكار شخصية
5. **الثروة:** تتبع الأصول والاستثمارات

**الدوال الرئيسية:** `renderW2Zen()`, `renderW2Family()`, `renderW2Health()`, `renderW2Growth()`, `renderW2Wealth()`

---

### 2.11 حسابات وماليات — `s-finance`
**الوظيفة:** إدارة مشاريع وميزانيات الأعمال المالية.

**المحتوى:**
- Kanban مالي للمشاريع
- مصاريف الأعمال مصنّفة
- مقارنة الميزانيات

**الدوال الرئيسية:** `buildBizFinanceHtml()`, `w2FormatDate()`

---

### 2.12 الإعدادات — `s-settings`
**الوظيفة:** إعدادات النظام وتكامل WhatsApp.

**المحتوى:**
- إعدادات WhatsApp (تشغيل/إيقاف، وقت الإرسال)
- جهات اتصال الفريق
- رسائل يومية مجدولة
- تصدير البيانات

**الدوال الرئيسية:** `renderSettings()`, `waLoadSettings()`, `waToggle()`, `waSendTestMsg()`, `renderReminders()`

---

### 2.13 الأقسام الفرعية (Sub-screens)

| القسم | المعرّف | الوظيفة |
|-------|---------|---------|
| تفاصيل البراند | `s-brand-detail` | صفحة تفصيلية لكل براند |
| تفاصيل المهمة | `s-task-detail` | صفحة تفصيلية لكل مهمة |
| تفاصيل المشروع | `s-project-detail` | صفحة تفصيلية لكل مشروع |
| المهام الفرعية | `s-subtasks` | عرض subtasks مفصّل |
| التذكيرات | `s-reminders` | إدارة التذكيرات |

---

## 3. الدوال الرئيسية ووظائفها

### 3.1 طبقة البيانات (Data Layer)

| الدالة | الوظيفة |
|--------|---------|
| `initSupabase()` | تهيئة Supabase client بعد تحميل DOM |
| `loadFromSupabase(callback)` | جلب جميع البيانات من Supabase عند البدء |
| `applySupabaseData(results)` | تحويل نتائج Supabase إلى متغيرات عالمية |
| `saveData()` | حفظ البيانات (Supabase + localStorage) |
| `saveDataLocal()` | حفظ في localStorage كـ backup |
| `syncAllToSupabase()` | مزامنة كاملة لجميع البيانات |
| `scheduleSbSync()` | جدولة مزامنة تلقائية |
| `sbUpsert(table, row)` | تحديث/إدراج صف واحد |
| `sbDelete(table, id)` | حذف صف |
| `sbSaveSettings(key, value)` | حفظ إعداد في `app_settings` |
| `migrateLocalToSupabase()` | ترحيل البيانات من localStorage إلى Supabase |

### 3.2 طبقة التحويل (Mapping Layer)

| الدالة | الاتجاه |
|--------|---------|
| `taskToRow(t)` | كائن JS → صف Supabase |
| `brandToRow(b)` | كائن JS → صف Supabase |
| `projectToRow(p)` | كائن JS → صف Supabase |
| `decisionToRow(d)` | كائن JS → صف Supabase |
| `employeeToRow(e)` | كائن JS → صف Supabase |
| `expenseToRow(e)` | كائن JS → صف Supabase |
| `eventToRow(e)` | كائن JS → صف Supabase |
| `rowToTask(r)` | صف Supabase → كائن JS |
| `rowToBrand(r)` | صف Supabase → كائن JS |
| `rowToProject(r)` | صف Supabase → كائن JS |
| `rowToDecision(r)` | صف Supabase → كائن JS |
| `rowToEmployee(r)` | صف Supabase → كائن JS |
| `rowToEvent(r)` | صف Supabase → كائن JS |

### 3.3 طبقة التنقل والعرض (Navigation & Render)

| الدالة | الوظيفة |
|--------|---------|
| `go(page, extra)` | التنقل بين الأقسام |
| `render()` | إعادة رسم القسم الحالي |
| `renderNav()` | رسم القائمة الجانبية |
| `renderCmd()` | رسم لوحة القيادة |
| `renderBrands()` | رسم قائمة البراندات |
| `renderBrandDetail()` | رسم تفاصيل براند |
| `renderTasks()` | رسم المهام |
| `renderTaskDetail()` | رسم تفاصيل مهمة |
| `renderProjectDetail()` | رسم تفاصيل مشروع |
| `renderDecisions()` | رسم القرارات |
| `renderCalendar()` | رسم التقويم |
| `renderPerformance()` | رسم الأداء |
| `renderPersonal()` | رسم الشخصي |
| `renderSettings()` | رسم الإعدادات |
| `renderArchive()` | رسم الأرشيف |
| `renderSales()` | رسم المبيعات |

### 3.4 دوال WhatsApp

| الدالة | الوظيفة |
|--------|---------|
| `waLoadSettings()` | تحميل إعدادات WhatsApp من Supabase |
| `waToggle()` | تشغيل/إيقاف WhatsApp |
| `waSendTestMsg()` | إرسال رسالة اختبار عبر Edge Function |
| `waAddContact()` | إضافة جهة اتصال |
| `waAddDailyMsg()` | إضافة رسالة يومية مجدولة |

### 3.5 دوال Weekly Focus

| الدالة | الوظيفة |
|--------|---------|
| `wfLoad(callback)` | تحميل بيانات الفوكس الأسبوعي |
| `wfSave(dateStr, data)` | حفظ فوكس يوم معين |
| `wfDelete(dateStr)` | حذف فوكس يوم |
| `wfRenderStickyBanner()` | عرض شريط الفوكس في القيادة |
| `wfRenderWeekStrip(container)` | عرض شريط الأسبوع |
| `wfOpenEditor(dateStr)` | فتح محرر الفوكس |
| `wfGetTodaySales(callback)` | جلب مبيعات اليوم من salla_orders |
| `wfGetHungryBrands()` | البراندات التي لم تُعطَ فوكس |

---

## 4. المتغيرات العالمية الرئيسية

```javascript
var BRANDS = [];          // البراندات
var PROJECTS = [];        // المشاريع
var TASKS = [];           // مهام البراندات
var PERSONAL_TASKS = [];  // المهام الشخصية
var DECISIONS = [];       // القرارات
var EMPLOYEES = [];       // الموظفون
var EVENTS = [];          // الأحداث
var EXPENSES = [];        // المصاريف الشخصية
var BIZ_EXPENSES = [];    // مصاريف الأعمال
var ARCHIVE = [];         // الأرشيف
var METRICS = [];         // مؤشرات الأداء
var CAMPAIGNS = [];       // الحملات
var INBOX_TASKS = [];     // مهام الوارد
var WEEKLY_FOCUS = {};    // الفوكس الأسبوعي
var REMINDERS = [];       // التذكيرات
var FINANCE_TASKS = [];   // مهام الماليات
var FINANCE_PROJECTS = []; // مشاريع الماليات
var state = { ... };      // حالة التطبيق
```

---

## 5. نظام المصادقة

النظام يستخدم **مصادقة بسيطة بكلمة مرور ثابتة** مخزّنة في المتصفح:

```javascript
var LOGIN_USER = 'ghazi111999';
var LOGIN_PASS = 'GgHhAaZzIi@336699'; // ⚠️ مكشوف في الكود!
```

**آلية العمل:**
1. عند فتح الصفحة، يتحقق `checkAuth()` من `localStorage['ghazi_os_auth']`
2. إذا كانت القيمة `'ok'`، يُخفى شاشة تسجيل الدخول
3. عند تسجيل الدخول، تُقارن بيانات المستخدم بالقيم الثابتة
4. عند النجاح، يُحفظ `'ok'` في localStorage

**⚠️ مخاطر أمنية حرجة:**
- كلمة المرور مكشوفة بالكامل في الكود المصدري
- أي شخص يفتح Developer Tools يرى بيانات الدخول
- لا يوجد JWT أو session حقيقي
- لا يوجد rate limiting أو حماية من brute force

---

## 6. نظام التخزين

### 6.1 Supabase (المصدر الرئيسي)
- 17 جدول موثّق في `DATABASE_SCHEMA.md`
- يُستخدم `anon key` مكشوف في الكود
- لا يوجد Row Level Security (RLS) موثّق
- كل العمليات من المتصفح مباشرة

### 6.2 localStorage (backup)
| المفتاح | المحتوى |
|---------|---------|
| `ghazi-os-v8` | نسخة احتياطية كاملة من البيانات |
| `ghazi_os_auth` | حالة تسجيل الدخول |
| `ghazi_saved_user` | اسم المستخدم المحفوظ |
| `ghazi_saved_pass` | كلمة المرور المحفوظة |
| `cmdSecState` | حالة أقسام لوحة القيادة |
| `inbox_tasks_cache` | cache لمهام الوارد |

---

## 7. التكاملات الخارجية

| التكامل | الطريقة | الأمان |
|---------|---------|--------|
| **Supabase** | REST API مباشر من المتصفح | ⚠️ anon key مكشوف |
| **Salla** | Webhook → salla_orders | ✅ من السيرفر |
| **WhatsApp** | Supabase Edge Function | ✅ من السيرفر |
| **Google Fonts** | CDN مباشر | ✅ |

---

## 8. المخاطر الأمنية الحرجة

### 🔴 خطر عالٍ — يجب معالجته فوراً في Next.js

**1. كلمة المرور مكشوفة:**
```javascript
var LOGIN_PASS = 'GgHhAaZzIi@336699'; // مرئي لأي شخص!
```
**الحل في Next.js:** استخدام NextAuth.js أو Supabase Auth مع JWT حقيقي.

**2. Supabase anon key مكشوف:**
```javascript
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```
**الحل في Next.js:** استخدام `SUPABASE_SERVICE_ROLE_KEY` في Server Actions فقط، و`NEXT_PUBLIC_SUPABASE_ANON_KEY` للقراءة العامة.

**3. لا يوجد RLS:**
أي شخص يعرف الـ URL يمكنه قراءة/كتابة البيانات مباشرة.
**الحل في Next.js:** تفعيل RLS على كل الجداول + Server Actions للكتابة.

**4. كل العمليات من المتصفح:**
لا يوجد validation على السيرفر.
**الحل في Next.js:** Zod validation في Server Actions.

---

## 9. المخاطر التقنية في النقل

### 🟡 تحديات متوسطة

**1. DOM Manipulation مباشر:**
الكود يعتمد على `innerHTML` و`document.getElementById` بشكل مكثّف. يجب إعادة كتابة كل هذا كـ React components.

**2. المتغيرات العالمية:**
552 دالة تشترك في متغيرات عالمية (`BRANDS`, `TASKS`, إلخ). في React، يجب استبدالها بـ Context أو Zustand.

**3. Inline Event Handlers:**
الكود مليء بـ `onclick="doSomething()"` في HTML المُولَّد. يجب تحويلها إلى React event handlers.

**4. الـ Hijri Calendar:**
يستخدم حسابات هجرية مخصصة. يجب استبدالها بـ `date-fns-hijri`.

**5. حجم الكود:**
552 دالة في ملف واحد = تعقيد عالٍ. يجب التقسيم بعناية.

---

## 10. توصيات للنقل

### ترتيب النقل المقترح (من الأسهل للأصعب)

| الترتيب | القسم | السبب |
|---------|-------|-------|
| 1 | الشريط الجانبي + Layout | أساس كل شيء |
| 2 | القيادة (Dashboard) | الأكثر استخداماً |
| 3 | المهام | منطق معقد لكن مستقل |
| 4 | التقويم | يعتمد على Events فقط |
| 5 | القرارات | بسيط نسبياً |
| 6 | البراندات | يعتمد على Tasks و Projects |
| 7 | الأداء | يعتمد على Metrics |
| 8 | الشخصي | مشابه للمهام |
| 9 | عوالمي | مستقل تماماً |
| 10 | حسابات وماليات | الأكثر تعقيداً |

### البنية المقترحة لـ Next.js

```
nextjs-app/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← Sidebar + Topbar
│   │   ├── page.tsx            ← القيادة
│   │   ├── brands/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── decisions/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── performance/page.tsx
│   │   ├── personal/page.tsx
│   │   ├── worlds/page.tsx
│   │   ├── finance/page.tsx
│   │   ├── sales/page.tsx
│   │   ├── archive/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       └── [...]/route.ts
├── components/
│   ├── ui/                     ← shadcn/ui
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── tasks/
│   ├── brands/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   ├── types/
│   └── utils/
├── hooks/
└── store/                      ← Zustand أو Context
```

---

*انتهى التقرير — يُرجى مراجعته قبل الانتقال إلى المرحلة الأولى.*
