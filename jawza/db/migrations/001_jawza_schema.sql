-- ============================================================
-- نظام الجوزاء — المدير التنفيذي الافتراضي
-- Migration: 001_jawza_schema.sql
-- تاريخ الإنشاء: 2026-04-13
-- ============================================================
-- ملاحظة: هذه الجداول مستقلة تماماً ولا تؤثر على الجداول الحالية

-- ============================================================
-- 1. جدول المنتجات المُعزَّز (للوعي المالي والمخزون)
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salla_product_id      TEXT UNIQUE,                    -- معرف المنتج في سلة
  name                  TEXT NOT NULL,
  category              TEXT CHECK (category IN (
    'perfume', 'bakhoor', 'hair_perfume', 'body_spray', 'special'
  )),
  price                 DECIMAL(10,2),
  cost_price            DECIMAL(10,2),                  -- تكلفة الوحدة الحقيقية
  profit_margin         DECIMAL(5,2)                    -- محسوب: (price - cost) / price * 100
    GENERATED ALWAYS AS (
      CASE WHEN price > 0 AND cost_price IS NOT NULL
        THEN ROUND(((price - cost_price) / price * 100)::NUMERIC, 2)
        ELSE NULL
      END
    ) STORED,
  stock_quantity        INTEGER DEFAULT 0,
  lead_time_days        INTEGER DEFAULT 7,              -- كم يوم يحتاج المصنع
  reorder_threshold     INTEGER,                        -- مستوى إعادة الطلب
  supplier_name         TEXT,                           -- اسم المصنع
  supplier_contact      TEXT,                           -- واتساب/جوال
  target_sales_velocity DECIMAL(5,2),                  -- المبيعات اليومية المتوقعة
  last_reordered_at     TIMESTAMPTZ,
  last_reorder_qty      INTEGER,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. جدول ملخص المبيعات اليومي (مُجمَّع من سلة)
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_sales_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                  DATE NOT NULL UNIQUE,
  total_orders          INTEGER DEFAULT 0,
  total_revenue         DECIMAL(10,2) DEFAULT 0,
  total_profit          DECIMAL(10,2) DEFAULT 0,
  avg_order_value       DECIMAL(10,2) DEFAULT 0,
  new_customers         INTEGER DEFAULT 0,
  returning_customers   INTEGER DEFAULT 0,
  abandoned_carts       INTEGER DEFAULT 0,
  abandoned_value       DECIMAL(10,2) DEFAULT 0,
  top_product_id        UUID REFERENCES jawza_products(id),
  top_product_qty       INTEGER DEFAULT 0,
  raw_snapshot          JSONB,                          -- snapshot كامل من سلة
  synced_at             TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. جدول مقاييس المنتجات (أداء كل منتج)
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_product_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID REFERENCES jawza_products(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  units_sold            INTEGER DEFAULT 0,
  revenue               DECIMAL(10,2) DEFAULT 0,
  profit                DECIMAL(10,2) DEFAULT 0,
  returns               INTEGER DEFAULT 0,
  avg_rating            DECIMAL(3,2),
  UNIQUE(product_id, date),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. جدول العملاء (مُزامَن من سلة)
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_customers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salla_customer_id     TEXT UNIQUE,
  name                  TEXT,
  phone                 TEXT,
  city                  TEXT,
  total_orders          INTEGER DEFAULT 0,
  total_spent           DECIMAL(10,2) DEFAULT 0,
  first_order_at        TIMESTAMPTZ,
  last_order_at         TIMESTAMPTZ,
  days_since_last_order INTEGER
    GENERATED ALWAYS AS (
      CASE WHEN last_order_at IS NOT NULL
        THEN EXTRACT(DAY FROM NOW() - last_order_at)::INTEGER
        ELSE NULL
      END
    ) STORED,
  segment               TEXT CHECK (segment IN (
    'champions', 'loyal', 'at_risk', 'lost', 'new', 'promising'
  )),
  ltv_estimate          DECIMAL(10,2),                  -- قيمة العميل المتوقعة
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. جدول أوامر الجوزاء (سجل كل قرار أصدره الذكاء الاصطناعي)
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_daily_commands (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  urgency               INTEGER CHECK (urgency BETWEEN 1 AND 10),
  category              TEXT CHECK (category IN (
    'urgent', 'opportunity', 'warning', 'insight', 'celebration', 'quiet'
  )),
  command_title         TEXT NOT NULL,                  -- "يا غازي، نفّذ X الآن"
  context               TEXT,                           -- السبب بأرقام
  if_executed           JSONB,                          -- {outcome, estimatedRevenue, timeframe}
  if_delayed            JSONB,                          -- {outcome, estimatedLoss, irreversible}
  magic_buttons         JSONB,                          -- [{label, icon, actionType, payload}]
  saudi_context_reason  TEXT,                           -- لماذا هذا التوقيت
  data_references       JSONB,                          -- [{metric, value, source}]
  personal_note         TEXT,                           -- ملاحظة الجوزاء الشخصية
  is_primary            BOOLEAN DEFAULT false,          -- هل هو القرار الرئيسي اليوم
  status                TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'executed', 'dismissed', 'snoozed'
  )),
  executed_at           TIMESTAMPTZ,
  dismissed_at          TIMESTAMPTZ,
  ai_model              TEXT DEFAULT 'claude-3-7-sonnet-latest',
  prompt_version        TEXT DEFAULT 'v1',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. جدول السياق السعودي (التقويم والمواسم)
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_saudi_context (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                  DATE NOT NULL UNIQUE,
  is_salary_day         BOOLEAN DEFAULT false,          -- يوم الراتب
  is_citizen_account    BOOLEAN DEFAULT false,          -- حساب المواطن
  days_to_salary        INTEGER,                        -- أيام لنزول الراتب
  cash_level            TEXT CHECK (cash_level IN (
    'peak', 'high', 'normal', 'low'
  )) DEFAULT 'normal',
  season                TEXT CHECK (season IN (
    'ramadan', 'eid_fitr', 'eid_adha', 'national_day', 'founding_day',
    'summer', 'back_to_school', 'winter', 'normal'
  )) DEFAULT 'normal',
  season_urgency        INTEGER DEFAULT 5,              -- 1-10
  hijri_month           INTEGER,                        -- الشهر الهجري
  hijri_day             INTEGER,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. جدول السلال المتروكة (للمتابعة)
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_abandoned_carts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salla_cart_id         TEXT UNIQUE,
  customer_id           UUID REFERENCES jawza_customers(id),
  customer_name         TEXT,
  customer_phone        TEXT,
  cart_value            DECIMAL(10,2),
  items_count           INTEGER,
  items_snapshot        JSONB,                          -- [{name, qty, price}]
  abandoned_at          TIMESTAMPTZ,
  recovery_sent_at      TIMESTAMPTZ,
  recovery_status       TEXT DEFAULT 'pending' CHECK (recovery_status IN (
    'pending', 'sent', 'recovered', 'lost'
  )),
  recovered_value       DECIMAL(10,2),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. جدول تاريخ المزامنة مع سلة
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_sync_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type             TEXT NOT NULL CHECK (sync_type IN (
    'products', 'orders', 'customers', 'carts', 'full'
  )),
  status                TEXT DEFAULT 'running' CHECK (status IN (
    'running', 'success', 'failed', 'partial'
  )),
  records_synced        INTEGER DEFAULT 0,
  error_message         TEXT,
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  duration_seconds      INTEGER
    GENERATED ALWAYS AS (
      CASE WHEN completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
        ELSE NULL
      END
    ) STORED
);

-- ============================================================
-- 9. جدول الأهداف الشهرية
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_monthly_goals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year                  INTEGER NOT NULL,
  month                 INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  revenue_target        DECIMAL(10,2) DEFAULT 50000,    -- الهدف الشهري (50,000 ريال)
  orders_target         INTEGER,
  new_customers_target  INTEGER,
  notes                 TEXT,
  UNIQUE(year, month),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. جدول الإشعارات والتنبيهات
-- ============================================================
CREATE TABLE IF NOT EXISTS jawza_alerts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  TEXT NOT NULL CHECK (type IN (
    'low_stock', 'big_order', 'vip_return', 'vip_churn_risk',
    'abandoned_cart', 'daily_briefing', 'milestone'
  )),
  title                 TEXT NOT NULL,
  body                  TEXT,
  priority              INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  is_read               BOOLEAN DEFAULT false,
  related_entity_type   TEXT,                           -- 'product', 'customer', 'order'
  related_entity_id     TEXT,
  action_url            TEXT,
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes للأداء
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jawza_sales_date ON jawza_sales_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_jawza_commands_date ON jawza_daily_commands(date DESC);
CREATE INDEX IF NOT EXISTS idx_jawza_commands_status ON jawza_daily_commands(status);
CREATE INDEX IF NOT EXISTS idx_jawza_customers_segment ON jawza_customers(segment);
CREATE INDEX IF NOT EXISTS idx_jawza_customers_last_order ON jawza_customers(last_order_at DESC);
CREATE INDEX IF NOT EXISTS idx_jawza_alerts_unread ON jawza_alerts(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jawza_product_metrics_date ON jawza_product_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_jawza_abandoned_status ON jawza_abandoned_carts(recovery_status);

-- ============================================================
-- بيانات أولية: الأهداف الشهرية لـ 2026
-- ============================================================
INSERT INTO jawza_monthly_goals (year, month, revenue_target, orders_target, new_customers_target)
VALUES
  (2026, 1,  50000, 250, 50),
  (2026, 2,  50000, 250, 50),
  (2026, 3,  70000, 350, 70),  -- رمضان
  (2026, 4,  80000, 400, 80),  -- عيد الفطر
  (2026, 5,  50000, 250, 50),
  (2026, 6,  50000, 250, 50),
  (2026, 7,  60000, 300, 60),
  (2026, 8,  50000, 250, 50),
  (2026, 9,  70000, 350, 70),  -- اليوم الوطني
  (2026, 10, 50000, 250, 50),
  (2026, 11, 50000, 250, 50),
  (2026, 12, 60000, 300, 60)   -- عيد الأضحى
ON CONFLICT (year, month) DO NOTHING;

-- ============================================================
-- تعليق ختامي
-- ============================================================
-- الجداول المنشأة:
-- 1. jawza_products         — المنتجات المُعزَّزة
-- 2. jawza_sales_daily      — ملخص المبيعات اليومي
-- 3. jawza_product_metrics  — مقاييس أداء المنتجات
-- 4. jawza_customers        — العملاء وشرائحهم
-- 5. jawza_daily_commands   — أوامر الجوزاء اليومية
-- 6. jawza_saudi_context    — التقويم السعودي والمواسم
-- 7. jawza_abandoned_carts  — السلال المتروكة
-- 8. jawza_sync_log         — سجل المزامنة مع سلة
-- 9. jawza_monthly_goals    — الأهداف الشهرية
-- 10. jawza_alerts          — الإشعارات والتنبيهات
