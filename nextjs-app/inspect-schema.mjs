import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) vars[k.trim()] = v.join('=').trim();
});

const sb = createClient(vars['SUPABASE_URL'], vars['SUPABASE_SERVICE_ROLE_KEY']);

async function inspectTable(name) {
  const { data, error } = await sb.from(name).select('*').limit(2);
  if (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return null;
  }
  if (data && data.length > 0) {
    const cols = Object.keys(data[0]);
    console.log(`✅ ${name} — أعمدة: [${cols.join(', ')}]`);
    console.log(`   عينة: ${JSON.stringify(data[0]).slice(0, 250)}`);
    return cols;
  } else {
    console.log(`✅ ${name} — فارغ (لا بيانات)`);
    return [];
  }
}

async function main() {
  const tables = [
    'calendar_events', 'events', 'brands', 'projects',
    'tasks', 'decisions', 'inbox_tasks', 'personal_tasks',
    'weekly_focus', 'archive'
  ];
  
  console.log('=== فحص بنية الجداول ===\n');
  for (const t of tables) {
    await inspectTable(t);
    console.log('');
  }
}

main().catch(console.error);
