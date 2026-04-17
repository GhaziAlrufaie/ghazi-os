import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(l => {
  const idx = l.indexOf('=');
  if (idx > 0) vars[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
});

const sb = createClient(vars['SUPABASE_URL'], vars['SUPABASE_SERVICE_ROLE_KEY']);

// جلب قائمة الجداول عبر information_schema
const { data, error } = await sb
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_type', 'BASE TABLE');

if (error) {
  console.log('Error:', error.message);
  // بديل: جرب rpc
  const { data: d2, error: e2 } = await sb.rpc('get_tables');
  console.log('rpc:', d2, e2?.message);
} else {
  console.log('All tables:', data.map(r => r.table_name).join(', '));
}
