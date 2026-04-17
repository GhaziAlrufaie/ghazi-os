import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://xitdxksliphmwonqjnsm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdGR4a3NsaXBobXdvbnFqbnNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0MzA0NCwiZXhwIjoyMDkwNjE5MDQ0fQ.SNKNWHqQXGGKCdYeuMKpBCzV2lgXnr60yV7EOMrbJr4'
);

const tables = [
  'accounts', 'expenses', 'employees', 'transactions',
  'bank_accounts', 'finance', 'team', 'payroll',
  'jawza_monthly_goals', 'budgets', 'invoices'
];

console.log('=== فحص جداول الدفعة الرابعة ===\n');

for (const table of tables) {
  try {
    const { data, error, count } = await sb.from(table).select('*', { count: 'exact' }).limit(2);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      const cols = data && data.length > 0 ? Object.keys(data[0]).join(', ') : 'فارغ';
      console.log(`✅ ${table} (${count} سجل)`);
      console.log(`   الأعمدة: ${cols}`);
      if (data && data.length > 0) {
        console.log(`   مثال: ${JSON.stringify(data[0]).substring(0, 150)}`);
      }
      console.log('');
    }
  } catch (e) {
    console.log(`❌ ${table}: ${e.message}`);
  }
}
