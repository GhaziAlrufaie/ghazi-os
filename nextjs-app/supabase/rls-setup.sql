-- ===================================================
-- Ghazi OS — RLS Setup
-- تفعيل Row Level Security على كل الجداول
-- Policy: المستخدم المصادق عليه فقط (service_role)
-- ===================================================
-- 
-- ملاحظة: Next.js يستخدم service_role key في Server-side
-- وهذا الـ key يتجاوز RLS تلقائياً — لذلك RLS هنا
-- يحمي من أي وصول مباشر عبر anon key فقط
-- ===================================================

-- تفعيل RLS على كل الجداول الرئيسية
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE biz_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salla_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_focus ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds_family_tasks ENABLE ROW LEVEL SECURITY;

-- ===================================================
-- حذف أي policies قديمة قبل إنشاء الجديدة
-- ===================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'tasks','brands','projects','decisions','personal_tasks',
    'expenses','biz_expenses','events','employees','salla_orders',
    'weekly_focus','app_settings','whatsapp_settings','team_contacts',
    'daily_messages','archive','metrics','campaigns','worlds_family_tasks'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_only" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "anon_read_deny" ON %I', tbl);
  END LOOP;
END $$;

-- ===================================================
-- إنشاء Policy: رفض كل وصول من anon key
-- (service_role يتجاوز RLS تلقائياً)
-- ===================================================

-- tasks
CREATE POLICY "anon_read_deny" ON tasks FOR ALL TO anon USING (false);

-- brands
CREATE POLICY "anon_read_deny" ON brands FOR ALL TO anon USING (false);

-- projects
CREATE POLICY "anon_read_deny" ON projects FOR ALL TO anon USING (false);

-- decisions
CREATE POLICY "anon_read_deny" ON decisions FOR ALL TO anon USING (false);

-- personal_tasks
CREATE POLICY "anon_read_deny" ON personal_tasks FOR ALL TO anon USING (false);

-- expenses
CREATE POLICY "anon_read_deny" ON expenses FOR ALL TO anon USING (false);

-- biz_expenses
CREATE POLICY "anon_read_deny" ON biz_expenses FOR ALL TO anon USING (false);

-- events
CREATE POLICY "anon_read_deny" ON events FOR ALL TO anon USING (false);

-- employees
CREATE POLICY "anon_read_deny" ON employees FOR ALL TO anon USING (false);

-- salla_orders
CREATE POLICY "anon_read_deny" ON salla_orders FOR ALL TO anon USING (false);

-- weekly_focus
CREATE POLICY "anon_read_deny" ON weekly_focus FOR ALL TO anon USING (false);

-- app_settings
CREATE POLICY "anon_read_deny" ON app_settings FOR ALL TO anon USING (false);

-- whatsapp_settings
CREATE POLICY "anon_read_deny" ON whatsapp_settings FOR ALL TO anon USING (false);

-- team_contacts
CREATE POLICY "anon_read_deny" ON team_contacts FOR ALL TO anon USING (false);

-- daily_messages
CREATE POLICY "anon_read_deny" ON daily_messages FOR ALL TO anon USING (false);

-- archive
CREATE POLICY "anon_read_deny" ON archive FOR ALL TO anon USING (false);

-- metrics
CREATE POLICY "anon_read_deny" ON metrics FOR ALL TO anon USING (false);

-- campaigns
CREATE POLICY "anon_read_deny" ON campaigns FOR ALL TO anon USING (false);

-- worlds_family_tasks
CREATE POLICY "anon_read_deny" ON worlds_family_tasks FOR ALL TO anon USING (false);

-- ===================================================
-- اختبار RLS — تحقق من تفعيله
-- ===================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'tasks','brands','projects','decisions','personal_tasks',
    'expenses','biz_expenses','events','employees','salla_orders',
    'weekly_focus','app_settings','whatsapp_settings','team_contacts',
    'daily_messages','archive','metrics','campaigns','worlds_family_tasks'
  )
ORDER BY tablename;
