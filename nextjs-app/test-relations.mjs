import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) vars[k.trim()] = v.join('=').trim();
});

const sb = createClient(vars['SUPABASE_URL'], vars['SUPABASE_SERVICE_ROLE_KEY']);

async function main() {
  console.log('=== فحص الترابط التفصيلي ===\n');

  // 1. فحص مشاريع مع brand_id
  const { data: prRaw } = await sb.from('projects').select('id, title, brand_id').limit(5);
  console.log('مشاريع (brand_id):');
  prRaw?.forEach(p => console.log(`  - "${p.title}" | brand_id: ${p.brand_id}`));

  // 2. فحص JOIN مع brands
  const { data: prJoin, error: prJoinErr } = await sb.from('projects')
    .select('id, title, brand_id, brands(id, name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  if (prJoinErr) console.log('❌ JOIN error:', prJoinErr.message);
  else {
    console.log('\nمشاريع مع JOIN:');
    prJoin?.forEach(p => console.log(`  - "${p.title}" → brands: ${JSON.stringify(p.brands)}`));
  }

  // 3. فحص أحداث مع brand_id
  const { data: evRaw } = await sb.from('events').select('id, title, brand_id').limit(5);
  console.log('\nأحداث (brand_id):');
  evRaw?.forEach(e => console.log(`  - "${e.title}" | brand_id: ${e.brand_id}`));

  // 4. فحص JOIN أحداث مع brands
  const { data: evJoin, error: evJoinErr } = await sb.from('events')
    .select('id, title, brand_id, brands(id, name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  if (evJoinErr) console.log('❌ JOIN error:', evJoinErr.message);
  else {
    console.log('\nأحداث مع JOIN:');
    evJoin?.forEach(e => console.log(`  - "${e.title}" → brands: ${JSON.stringify(e.brands)}`));
  }

  // 5. فحص مهام مع brand_id
  const { data: tasksRaw } = await sb.from('tasks').select('id, title, brand_id').limit(5);
  console.log('\nمهام (brand_id):');
  tasksRaw?.forEach(t => console.log(`  - "${t.title}" | brand_id: ${t.brand_id}`));

  // 6. فحص JOIN مهام مع brands
  const { data: tasksJoin, error: tasksJoinErr } = await sb.from('tasks')
    .select('id, title, brand_id, brands(id, name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  if (tasksJoinErr) console.log('❌ JOIN error:', tasksJoinErr.message);
  else {
    console.log('\nمهام مع JOIN:');
    tasksJoin?.forEach(t => console.log(`  - "${t.title}" → brands: ${JSON.stringify(t.brands)}`));
  }

  // 7. فحص قرارات مع brand_id
  const { data: decisRaw } = await sb.from('decisions').select('id, title, brand_id').limit(5);
  console.log('\nقرارات (brand_id):');
  decisRaw?.forEach(d => console.log(`  - "${d.title}" | brand_id: ${d.brand_id}`));

  // 8. فحص JOIN قرارات مع brands
  const { data: decisJoin, error: decisJoinErr } = await sb.from('decisions')
    .select('id, title, brand_id, brands(id, name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  if (decisJoinErr) console.log('❌ JOIN error:', decisJoinErr.message);
  else {
    console.log('\nقرارات مع JOIN:');
    decisJoin?.forEach(d => console.log(`  - "${d.title}" → brands: ${JSON.stringify(d.brands)}`));
  }

  // 9. التحقق من مشروع محدد مع JOIN
  const { data: prSingle, error: prSingleErr } = await sb.from('projects')
    .select('*, brands(*)')
    .eq('id', 'x1774757445059ycf6m')
    .single();
  if (prSingleErr) console.log('\n❌ مشروع محدد:', prSingleErr.message);
  else console.log('\nمشروع محدد مع كل بيانات البراند:', JSON.stringify(prSingle?.brands).slice(0,200));
}

main().catch(console.error);
