import { createClient } from '@supabase/supabase-js';

const url = 'https://xitdxksliphmwonqjnsm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdGR4a3NsaXBobXdvbnFqbnNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0MzA0NCwiZXhwIjoyMDkwNjE5MDQ0fQ.SNKNWHqQXGGKCdYeuMKpBCzV2lgXnr60yV7EOMrbJr4';
const sb = createClient(url, key);

// 1. تحقق من القرار التجريبي
const { data: dec } = await sb.from('decisions').select('id,title,status,priority').eq('title','TEST_DECISION_BATCH3');
console.log('✅ DECISION SAVED:', JSON.stringify(dec));

// 2. عدد القرارات الكلي
const { count: decCount } = await sb.from('decisions').select('*', { count: 'exact', head: true });
console.log('📊 TOTAL DECISIONS:', decCount);

// 3. عدد الموظفين
const { count: empCount } = await sb.from('employees').select('*', { count: 'exact', head: true });
console.log('👥 TOTAL EMPLOYEES:', empCount);

// 4. عدد المقاييس
const { count: metCount } = await sb.from('metrics').select('*', { count: 'exact', head: true });
console.log('📈 TOTAL METRICS:', metCount);

// 5. عدد الأهداف الشهرية
const { count: goalCount } = await sb.from('jawza_monthly_goals').select('*', { count: 'exact', head: true });
console.log('🎯 TOTAL GOALS:', goalCount);

// 6. عدد الحملات
const { count: campCount } = await sb.from('campaigns').select('*', { count: 'exact', head: true });
console.log('📣 TOTAL CAMPAIGNS:', campCount);

// 7. عدد الطلبات
const { count: orderCount } = await sb.from('salla_orders').select('*', { count: 'exact', head: true });
console.log('🛒 TOTAL ORDERS:', orderCount);

// 8. عدد مبيعات الجوزاء اليومية
const { count: salesCount } = await sb.from('jawza_sales_daily').select('*', { count: 'exact', head: true });
console.log('💰 TOTAL DAILY SALES:', salesCount);
