# توثيق قاعدة بيانات Supabase — Ghazi OS
**تاريخ التوثيق:** 13 أبريل 2026  
**المُعِد:** Manus AI  
**المصدر:** استخراج من `index.html` (الكود المصدري)

> **تحذير:** هذا التوثيق مستخرج من الكود المصدري وليس من Supabase مباشرة. قد تكون هناك أعمدة إضافية أو قيود (constraints) غير موثّقة في الكود.

---

## معلومات الاتصال

| المعلومة | القيمة |
|---------|--------|
| Project URL | `https://xitdxksliphmwonqjnsm.supabase.co` |
| Project Ref | `xitdxksliphmwonqjnsm` |
| Anon Key | مكشوف في الكود ⚠️ |
| Edge Functions | `send-whatsapp` |

---

## قائمة الجداول (27 جدول)

| # | اسم الجدول | الوظيفة | يُستخدم في |
|---|-----------|---------|-----------|
| 1 | `tasks` | مهام البراندات | المهام، البراندات، القيادة |
| 2 | `personal_tasks` | المهام الشخصية | الشخصي |
| 3 | `brands` | البراندات | البراندات، كل النظام |
| 4 | `projects` | المشاريع | البراندات، المهام |
| 5 | `decisions` | القرارات | القرارات، القيادة |
| 6 | `employees` | الموظفون | الإعدادات، القيادة |
| 7 | `events` | الأحداث والمناسبات | التقويم، القيادة |
| 8 | `expenses` | المصاريف الشخصية | الشخصي |
| 9 | `biz_expenses` | مصاريف الأعمال | الماليات |
| 10 | `salla_orders` | طلبات Salla | المبيعات، القيادة |
| 11 | `inbox_tasks` | مهام الوارد السريعة | القيادة |
| 12 | `weekly_focus` | الفوكس الأسبوعي | القيادة |
| 13 | `app_settings` | إعدادات التطبيق | الإعدادات |
| 14 | `whatsapp_settings` | إعدادات WhatsApp | الإعدادات |
| 15 | `team_contacts` | جهات اتصال الفريق | الإعدادات، WhatsApp |
| 16 | `daily_messages` | الرسائل اليومية المجدولة | الإعدادات، WhatsApp |
| 17 | `archive` | الأرشيف | الأرشيف |
| 18 | `metrics` | مؤشرات الأداء اليومية | الأداء |
| 19 | `campaigns` | الحملات التسويقية | البراندات |
| 20 | `worlds_family_tasks` | مهام العائلة | عوالمي |
| 21 | `jawza_abandoned_carts` | سلات مهجورة (Salla) | (jawza - غير مستخدم) |
| 22 | `jawza_alerts` | تنبيهات jawza | (jawza - غير مستخدم) |
| 23 | `jawza_customers` | عملاء jawza | (jawza - غير مستخدم) |
| 24 | `jawza_daily_commands` | أوامر jawza اليومية | (jawza - غير مستخدم) |
| 25 | `jawza_monthly_goals` | أهداف jawza الشهرية | (jawza - غير مستخدم) |
| 26 | `jawza_product_metrics` | مقاييس منتجات jawza | (jawza - غير مستخدم) |
| 27 | `jawza_products` | منتجات jawza | (jawza - غير مستخدم) |
| 28 | `jawza_sales_daily` | مبيعات jawza اليومية | (jawza - غير مستخدم) |
| 29 | `jawza_saudi_context` | السياق السعودي jawza | (jawza - غير مستخدم) |
| 30 | `jawza_sync_log` | سجل مزامنة jawza | (jawza - غير مستخدم) |

> **ملاحظة:** جداول `jawza_*` (10 جداول) تعود لمشروع jawza-app المُجمَّد. لا تُستخدم في Ghazi OS الحالي ويمكن تجاهلها.

---

## تفاصيل كل جدول

### 1. جدول `tasks` — مهام البراندات

```sql
tasks (
  id            TEXT PRIMARY KEY,
  project_id    TEXT REFERENCES projects(id),
  brand_id      TEXT REFERENCES brands(id),
  title         TEXT NOT NULL DEFAULT '',
  description   TEXT DEFAULT '',
  status        TEXT DEFAULT 'todo',        -- 'todo' | 'in-progress' | 'review' | 'done'
  priority      TEXT DEFAULT 'medium',      -- 'critical' | 'high' | 'medium' | 'low'
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  tags          JSONB DEFAULT '[]',
  notes         TEXT DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  checklist     JSONB DEFAULT '[]',         -- [{id, text, done}]
  subtasks      JSONB DEFAULT '[]',         -- [{id, title, status, ...}]
  subtask_groups JSONB DEFAULT '[]',        -- [{id, title, items:[...]}]
  links         JSONB DEFAULT '[]',         -- [{id, url, title}]
  attachments   JSONB DEFAULT '[]',         -- [{id, url, name, type}]
  category      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

**ملاحظات:**
- `checklist` و`subtasks` و`links` و`attachments` مخزّنة كـ JSONB
- `status` القيم المتاحة: `todo`, `in-progress`, `review`, `done`
- `priority` القيم المتاحة: `critical`, `high`, `medium`, `low`

---

### 2. جدول `personal_tasks` — المهام الشخصية

```sql
personal_tasks (
  -- نفس هيكل جدول tasks تماماً
  -- الدالة: personalTaskToRow(t) = taskToRow(t)
  id            TEXT PRIMARY KEY,
  project_id    TEXT,
  brand_id      TEXT,
  title         TEXT NOT NULL DEFAULT '',
  description   TEXT DEFAULT '',
  status        TEXT DEFAULT 'todo',
  priority      TEXT DEFAULT 'medium',
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  tags          JSONB DEFAULT '[]',
  notes         TEXT DEFAULT '',
  sort_order    INTEGER DEFAULT 0,
  checklist     JSONB DEFAULT '[]',
  subtasks      JSONB DEFAULT '[]',
  subtask_groups JSONB DEFAULT '[]',
  links         JSONB DEFAULT '[]',
  attachments   JSONB DEFAULT '[]',
  category      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

---

### 3. جدول `brands` — البراندات

```sql
brands (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  name_en         TEXT DEFAULT '',
  color           TEXT DEFAULT '#888',
  icon            TEXT DEFAULT '',           -- emoji أو SVG
  status          TEXT DEFAULT 'active',     -- 'active' | 'selling' | 'paused' | 'archived'
  health_score    INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  description     TEXT DEFAULT '',
  production_days INTEGER DEFAULT 7,
  nav_order       INTEGER DEFAULT 0,
  main_tab_label  TEXT                       -- تسمية التبويب الرئيسي المخصصة
)
```

**البراندات الحالية:**
| id | الاسم | اللون | الحالة |
|----|-------|-------|--------|
| b1 | بيت الجوزاء | `#C9A84C` | active |
| b2 | أودريد | `#8B5CF6` | selling |
| b3 | غازي بوتيك | `#10B981` | active |
| b4 | ذكرني | `#3B82F6` | active |

---

### 4. جدول `projects` — المشاريع

```sql
projects (
  id          TEXT PRIMARY KEY,
  brand_id    TEXT REFERENCES brands(id),
  title       TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  status      TEXT DEFAULT 'active',    -- 'active' | 'completed' | 'paused' | 'archived'
  priority    TEXT DEFAULT 'medium',
  start_date  DATE,
  target_date DATE,
  progress    INTEGER DEFAULT 0,        -- 0-100
  tags        JSONB DEFAULT '[]',
  sort_order  INTEGER DEFAULT 0
)
```

---

### 5. جدول `decisions` — القرارات

```sql
decisions (
  id               TEXT PRIMARY KEY,
  brand_id         TEXT REFERENCES brands(id),
  project_id       TEXT REFERENCES projects(id),
  title            TEXT NOT NULL DEFAULT '',
  context          TEXT DEFAULT '',
  options          JSONB DEFAULT '[]',   -- [{id, title, pros, cons}]
  chosen_option_id TEXT,
  status           TEXT DEFAULT 'pending',  -- 'pending' | 'decided' | 'cancelled'
  impact           TEXT DEFAULT 'medium',   -- 'critical' | 'high' | 'medium' | 'low'
  deadline         DATE,
  decided_at       TIMESTAMPTZ,
  decided_by       TEXT,
  notes            TEXT DEFAULT ''
)
```

---

### 6. جدول `employees` — الموظفون

```sql
employees (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT '',
  role          TEXT DEFAULT '',
  brand_ids     JSONB DEFAULT '[]',        -- قائمة brand IDs
  salary_type   TEXT,                      -- 'monthly' | 'hourly' | 'commission'
  salary_amount NUMERIC DEFAULT 0,
  salary_unit   TEXT,                      -- 'SAR' | 'USD'
  reports_to    TEXT,                      -- employee id
  status        TEXT DEFAULT 'active',     -- 'active' | 'inactive'
  created_at    TIMESTAMPTZ DEFAULT now()
)
```

---

### 7. جدول `events` — الأحداث والمناسبات

```sql
events (
  id       TEXT PRIMARY KEY,
  title    TEXT NOT NULL DEFAULT '',
  day      INTEGER,                    -- 1-31
  month    INTEGER,                    -- 1-12 (ميلادي)
  year     INTEGER,
  brand_id TEXT REFERENCES brands(id),
  type     TEXT DEFAULT 'event'        -- 'event' | 'occasion' | 'reminder'
)
```

---

### 8. جدول `expenses` — المصاريف الشخصية

```sql
expenses (
  id    TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  type  TEXT DEFAULT '',
  color TEXT DEFAULT '',
  items JSONB DEFAULT '[]'   -- [{id, name, amount, date, ...}]
)
```

---

### 9. جدول `biz_expenses` — مصاريف الأعمال

```sql
biz_expenses (
  id    TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  type  TEXT DEFAULT '',
  color TEXT DEFAULT '',
  items JSONB DEFAULT '[]'
)
```

---

### 10. جدول `salla_orders` — طلبات Salla

```sql
salla_orders (
  id              BIGINT PRIMARY KEY,       -- auto-increment
  salla_order_id  TEXT,                     -- معرّف الطلب في Salla
  order_number    TEXT,                     -- رقم الطلب (مثل: ORD-TEST-001)
  status          TEXT,                     -- 'pending' | 'completed' | 'cancelled' | ...
  customer_name   TEXT,
  customer_phone  TEXT,
  customer_email  TEXT,
  total_amount    NUMERIC,
  currency        TEXT DEFAULT 'SAR',
  items           JSONB DEFAULT '[]',       -- [{name, price, quantity, sku}]
  raw_payload     JSONB,                    -- الـ payload الكامل من Salla Webhook
  brand           TEXT,                     -- اسم البراند (مثل: 'غازي بوتيك')
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```

**ملاحظة:** هذا الجدول يُملأ عبر Salla Webhook تلقائياً. الكود يقرأ منه فقط عبر `loadSalesData()` و`wfGetTodaySales()`. الـ `id` هنا `BIGINT` وليس `TEXT` كبقية الجداول.

---

### 11. جدول `inbox_tasks` — مهام الوارد

```sql
inbox_tasks (
  id         TEXT PRIMARY KEY,
  text       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
)
```

**ملاحظة:** جدول بسيط جداً. يُستخدم كـ "صندوق وارد" للأفكار السريعة.

---

### 12. جدول `weekly_focus` — الفوكس الأسبوعي

```sql
weekly_focus (
  focus_date     DATE PRIMARY KEY,    -- 'YYYY-MM-DD'
  target_type    TEXT,                -- 'brand' | 'project'
  target_id      TEXT,
  target_name    TEXT,
  target_color   TEXT,
  notes          TEXT,
  metrics_cache  JSONB               -- {today_sales: number, ...}
)
```

---

### 13. جدول `app_settings` — إعدادات التطبيق

```sql
app_settings (
  key   TEXT PRIMARY KEY,
  value JSONB
)
```

**المفاتيح المعروفة:**
| المفتاح | الوظيفة |
|---------|---------|
| `dashPanels` | ترتيب لوحات القيادة |
| `dashOrder` | ترتيب أقسام القيادة |
| `brandsExpanded` | حالة توسيع البراندات في القائمة |
| `useEasternNumerals` | استخدام الأرقام الشرقية |
| `taskView` | طريقة عرض المهام (list/kanban) |
| `projectView` | طريقة عرض المشاريع |

---

### 14. جدول `whatsapp_settings` — إعدادات WhatsApp

```sql
whatsapp_settings (
  id           TEXT PRIMARY KEY DEFAULT 'main',
  enabled      BOOLEAN DEFAULT false,
  morning_msg  BOOLEAN DEFAULT false,
  send_time    TEXT DEFAULT '08:00',
  owner_phone  TEXT DEFAULT ''
)
```

---

### 15. جدول `team_contacts` — جهات اتصال الفريق

```sql
team_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

### 16. جدول `daily_messages` — الرسائل اليومية المجدولة

```sql
daily_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES team_contacts(id),
  send_time  TEXT NOT NULL,           -- 'HH:MM'
  message    TEXT NOT NULL,
  active     BOOLEAN DEFAULT true
)
```

**علاقة:** `daily_messages.contact_id → team_contacts.id`  
يُستخدم JOIN: `.select('*, team_contacts(name)')`

---

### 17. جدول `archive` — الأرشيف

```sql
archive (
  id              TEXT PRIMARY KEY,
  type            TEXT,               -- 'task' | 'decision' | 'project'
  reason          TEXT,               -- سبب الأرشفة
  archived_at     TIMESTAMPTZ DEFAULT now(),
  archived_month  INTEGER,
  archived_year   INTEGER,
  data            JSONB,              -- البيانات الأصلية كاملة
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```

---

### 18. جدول `metrics` — مؤشرات الأداء

```sql
metrics (
  id               TEXT PRIMARY KEY,
  brand_id         TEXT REFERENCES brands(id),
  date             DATE,
  revenue          NUMERIC,
  orders           INTEGER,
  avg_order_value  NUMERIC,
  ad_spend         NUMERIC,
  roas             NUMERIC,
  custom_metrics   JSONB DEFAULT '{}',
  updated_at       TIMESTAMPTZ DEFAULT now()
)
```

---

### 19. جدول `campaigns` — الحملات التسويقية

```sql
campaigns (
  id              TEXT PRIMARY KEY,
  brand_id        TEXT REFERENCES brands(id),
  title           TEXT NOT NULL,
  type            TEXT,               -- 'email' | 'social' | 'ads' | ...
  status          TEXT DEFAULT 'draft',
  start_date      DATE,
  end_date        DATE,
  budget          NUMERIC,
  actual_spend    NUMERIC,
  channels        JSONB DEFAULT '[]',
  target_metrics  JSONB DEFAULT '{}',
  actual_metrics  JSONB DEFAULT '{}',
  tasks           JSONB DEFAULT '[]',
  notes           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```

---

### 20. جدول `worlds_family_tasks` — مهام العائلة

```sql
worlds_family_tasks (
  -- الجدول فارغ حالياً، الهيكل الدقيق يحتاج تحقق
  -- يُرجَّح أنه مشابه لـ personal_tasks
)
```

---

## خريطة العلاقات

```
brands ──┬── projects ──── tasks
         ├── tasks (مباشرة)
         ├── decisions
         ├── employees (brand_ids[])
         └── events

team_contacts ──── daily_messages

weekly_focus (مستقل - يرتبط بـ brand/project عبر target_id)
inbox_tasks (مستقل)
salla_orders (مستقل - يُملأ من Webhook)
app_settings (مستقل - key-value store)
whatsapp_settings (مستقل - صف واحد)
archive (مستقل)
expenses (مستقل)
biz_expenses (مستقل)
personal_tasks (مستقل - نفس هيكل tasks)
```

---

## Row Level Security (RLS)

**الوضع الحالي:** لا يوجد دليل على تفعيل RLS في الكود المصدري.

جميع العمليات تستخدم `anon key` مباشرة من المتصفح، مما يعني أن أي شخص يعرف الـ Project URL يمكنه نظرياً الوصول للبيانات.

**التوصية للنقل إلى Next.js:**

```sql
-- تفعيل RLS على كل الجداول
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
-- ... إلخ

-- سياسة: فقط المستخدم المصادق عليه يمكنه الوصول
CREATE POLICY "authenticated_only" ON tasks
  FOR ALL USING (auth.role() = 'authenticated');
```

---

## Supabase Edge Functions

### `send-whatsapp`
**URL:** `https://xitdxksliphmwonqjnsm.supabase.co/functions/v1/send-whatsapp`

**الاستخدام في الكود:**
```javascript
fetch(SUPABASE_URL + '/functions/v1/send-whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, message })
});
```

**الوظيفة:** إرسال رسائل WhatsApp عبر API خارجي (على الأرجح Twilio أو WhatsApp Business API).

---

## ملاحظات مهمة للنقل

**1. JSONB Arrays:** الجداول تستخدم JSONB بكثافة لتخزين arrays (`checklist`, `subtasks`, `tags`, إلخ). في Next.js، يجب التعامل معها بعناية عند الـ TypeScript typing.

**2. TEXT Primary Keys:** معظم الجداول تستخدم `TEXT` كـ primary key (وليس UUID). هذا يعني أن الـ IDs تُولَّد في الكود JavaScript وليس في قاعدة البيانات.

**3. لا يوجد Foreign Key Constraints موثّقة:** الكود يفترض العلاقات لكن لا يُطبّقها على مستوى قاعدة البيانات.

**4. جدول `salla_orders`:** يجب التحقق من هيكله الكامل في Supabase مباشرة، لأن الكود يقرأ منه فقط ولا يكتب فيه.

**5. النسخ الاحتياطية:** يوجد GitHub Action يعمل يومياً لنسخ البيانات إلى `backups/` في المستودع.

---

*انتهى التوثيق — يُرجى التحقق من Supabase Dashboard للتأكد من الهيكل الفعلي قبل البدء في النقل.*
