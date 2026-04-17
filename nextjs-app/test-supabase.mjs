import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// قراءة .env.local يدوياً
const env = readFileSync('.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) vars[k.trim()] = v.join('=').trim();
});

const sb = createClient(vars['SUPABASE_URL'], vars['SUPABASE_SERVICE_ROLE_KEY']);

async function main() {
  // عدد العناصر الأولية
  const { count: calCount } = await sb.from('calendar_events').select('*', { count: 'exact', head: true });
  const { count: evCount } = await sb.from('events').select('*', { count: 'exact', head: true });
  const { count: brCount } = await sb.from('brands').select('*', { count: 'exact', head: true });
  const { count: prCount } = await sb.from('projects').select('*', { count: 'exact', head: true });

  console.log('=== الأعداد الأولية ===');
  console.log('calendar_events:', calCount);
  console.log('events:', evCount);
  console.log('brands:', brCount);
  console.log('projects:', prCount);

  // ========== 1. اختبار التقويم ==========
  console.log('\n=== اختبار التقويم ===');
  
  // إضافة
  const { data: calNew, error: calErr } = await sb.from('calendar_events').insert({
    title: 'TEST_BATCH2_CALENDAR',
    date: '2026-04-14',
    type: 'عام',
    recurrence: 'لا يتكرر'
  }).select().single();
  if (calErr) { console.error('❌ إضافة تقويم:', calErr.message); }
  else { console.log('✅ إضافة تقويم — ID:', calNew.id, '| العنوان:', calNew.title); }

  // تعديل
  if (calNew) {
    const { data: calUpd, error: calUpdErr } = await sb.from('calendar_events')
      .update({ title: 'TEST_BATCH2_CALENDAR_UPDATED' })
      .eq('id', calNew.id).select().single();
    if (calUpdErr) { console.error('❌ تعديل تقويم:', calUpdErr.message); }
    else { console.log('✅ تعديل تقويم — العنوان الجديد:', calUpd.title); }

    // حذف
    const { error: calDelErr } = await sb.from('calendar_events').delete().eq('id', calNew.id);
    if (calDelErr) { console.error('❌ حذف تقويم:', calDelErr.message); }
    else { console.log('✅ حذف تقويم — ID:', calNew.id, 'محذوف'); }
  }

  // التحقق من العدد بعد الحذف
  const { count: calCountAfter } = await sb.from('calendar_events').select('*', { count: 'exact', head: true });
  console.log('عدد التقويم بعد الاختبار:', calCountAfter, '(يجب أن يساوي', calCount, ')');

  // ========== 2. اختبار الأحداث ==========
  console.log('\n=== اختبار الأحداث ===');

  // جلب brand_id صالح
  const { data: brands } = await sb.from('brands').select('id, name').limit(1);
  const brandId = brands?.[0]?.id;
  console.log('براند للاختبار:', brands?.[0]?.name, '| ID:', brandId);

  const { data: evNew, error: evErr } = await sb.from('events').insert({
    title: 'TEST_BATCH2_EVENT',
    event_date: '2026-04-14',
    type: 'اجتماع',
    brand_id: brandId || null
  }).select().single();
  if (evErr) { console.error('❌ إضافة حدث:', evErr.message); }
  else { console.log('✅ إضافة حدث — ID:', evNew.id, '| العنوان:', evNew.title); }

  if (evNew) {
    const { data: evUpd, error: evUpdErr } = await sb.from('events')
      .update({ title: 'TEST_BATCH2_EVENT_UPDATED' })
      .eq('id', evNew.id).select().single();
    if (evUpdErr) { console.error('❌ تعديل حدث:', evUpdErr.message); }
    else { console.log('✅ تعديل حدث — العنوان الجديد:', evUpd.title); }

    const { error: evDelErr } = await sb.from('events').delete().eq('id', evNew.id);
    if (evDelErr) { console.error('❌ حذف حدث:', evDelErr.message); }
    else { console.log('✅ حذف حدث — ID:', evNew.id, 'محذوف'); }
  }

  const { count: evCountAfter } = await sb.from('events').select('*', { count: 'exact', head: true });
  console.log('عدد الأحداث بعد الاختبار:', evCountAfter, '(يجب أن يساوي', evCount, ')');

  // ========== 3. اختبار البراندات ==========
  console.log('\n=== اختبار البراندات ===');

  const { data: brNew, error: brErr } = await sb.from('brands').insert({
    name: 'TEST_BATCH2_BRAND',
    name_en: 'Test Brand',
    emoji: '🧪',
    status: 'نشط',
    color: '#ff0000'
  }).select().single();
  if (brErr) { console.error('❌ إضافة براند:', brErr.message); }
  else { console.log('✅ إضافة براند — ID:', brNew.id, '| الاسم:', brNew.name); }

  if (brNew) {
    const { data: brUpd, error: brUpdErr } = await sb.from('brands')
      .update({ name: 'TEST_BATCH2_BRAND_UPDATED' })
      .eq('id', brNew.id).select().single();
    if (brUpdErr) { console.error('❌ تعديل براند:', brUpdErr.message); }
    else { console.log('✅ تعديل براند — الاسم الجديد:', brUpd.name); }

    const { error: brDelErr } = await sb.from('brands').delete().eq('id', brNew.id);
    if (brDelErr) { console.error('❌ حذف براند:', brDelErr.message); }
    else { console.log('✅ حذف براند — ID:', brNew.id, 'محذوف'); }
  }

  const { count: brCountAfter } = await sb.from('brands').select('*', { count: 'exact', head: true });
  console.log('عدد البراندات بعد الاختبار:', brCountAfter, '(يجب أن يساوي', brCount, ')');

  // ========== 4. اختبار المشاريع ==========
  console.log('\n=== اختبار المشاريع ===');

  const { data: prNew, error: prErr } = await sb.from('projects').insert({
    title: 'TEST_BATCH2_PROJECT',
    brand_id: brandId || null,
    status: 'تخطيط',
    priority: 'متوسط'
  }).select().single();
  if (prErr) { console.error('❌ إضافة مشروع:', prErr.message); }
  else { console.log('✅ إضافة مشروع — ID:', prNew.id, '| العنوان:', prNew.title); }

  if (prNew) {
    const { data: prUpd, error: prUpdErr } = await sb.from('projects')
      .update({ title: 'TEST_BATCH2_PROJECT_UPDATED', status: 'نشط' })
      .eq('id', prNew.id).select().single();
    if (prUpdErr) { console.error('❌ تعديل مشروع:', prUpdErr.message); }
    else { console.log('✅ تعديل مشروع — العنوان الجديد:', prUpd.title, '| الحالة:', prUpd.status); }

    const { error: prDelErr } = await sb.from('projects').delete().eq('id', prNew.id);
    if (prDelErr) { console.error('❌ حذف مشروع:', prDelErr.message); }
    else { console.log('✅ حذف مشروع — ID:', prNew.id, 'محذوف'); }
  }

  const { count: prCountAfter } = await sb.from('projects').select('*', { count: 'exact', head: true });
  console.log('عدد المشاريع بعد الاختبار:', prCountAfter, '(يجب أن يساوي', prCount, ')');

  // ========== 5. اختبار الترابط ==========
  console.log('\n=== اختبار الترابط ===');

  // هل المشاريع تحمل brand_id صحيح؟
  const { data: prWithBrand } = await sb.from('projects')
    .select('id, title, brand_id, brands(name, emoji)')
    .not('brand_id', 'is', null)
    .limit(3);
  console.log('مشاريع مرتبطة ببراند:');
  prWithBrand?.forEach(p => console.log(' -', p.title, '→', p.brands?.emoji, p.brands?.name));

  // هل الأحداث تحمل brand_id صحيح؟
  const { data: evWithBrand } = await sb.from('events')
    .select('id, title, brand_id, brands(name, emoji)')
    .not('brand_id', 'is', null)
    .limit(3);
  console.log('أحداث مرتبطة ببراند:');
  evWithBrand?.forEach(e => console.log(' -', e.title, '→', e.brands?.emoji, e.brands?.name));

  // هل المهام (tasks) تحمل brand_id؟
  const { data: tasksWithBrand } = await sb.from('tasks')
    .select('id, title, brand_id, brands(name, emoji)')
    .not('brand_id', 'is', null)
    .limit(3);
  console.log('مهام مرتبطة ببراند:');
  tasksWithBrand?.forEach(t => console.log(' -', t.title, '→', t.brands?.emoji, t.brands?.name));

  // هل القرارات (decisions) تحمل brand_id؟
  const { data: decisionsWithBrand } = await sb.from('decisions')
    .select('id, title, brand_id, brands(name, emoji)')
    .not('brand_id', 'is', null)
    .limit(3);
  console.log('قرارات مرتبطة ببراند:');
  decisionsWithBrand?.forEach(d => console.log(' -', d.title, '→', d.brands?.emoji, d.brands?.name));

  console.log('\n=== اكتمل الاختبار ===');
}

main().catch(console.error);
