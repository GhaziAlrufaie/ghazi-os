import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(l => {
  const idx = l.indexOf('=');
  if (idx > 0) vars[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
});

const sb = createClient(vars['SUPABASE_URL'], vars['SUPABASE_SERVICE_ROLE_KEY']);

const tables = [
  'leadership_notes', 'performance_metrics', 'performance_reviews',
  'sales_records', 'sales_leads', 'sales_deals', 'kpis', 'goals', 'habits',
  'leadership', 'performance', 'sales'
];

for (const t of tables) {
  const { data, error } = await sb.from(t).select('*').limit(3);
  if (error) {
    console.log(`❌ ${t}: ${error.message}`);
  } else {
    const cols = data[0] ? Object.keys(data[0]).join(', ') : 'empty';
    console.log(`✅ ${t}: ${data.length} rows | cols: ${cols}`);
    if (data[0]) console.log(`   sample:`, JSON.stringify(data[0]).slice(0, 200));
  }
}
