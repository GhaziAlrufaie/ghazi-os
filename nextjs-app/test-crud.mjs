import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) vars[k.trim()] = v.join('=').trim();
});

const sb = createClient(vars['SUPABASE_URL'], vars['SUPABASE_SERVICE_ROLE_KEY']);

let passed = 0;
let failed = 0;
const results = [];

function log(status, section, op, detail) {
  const icon = status === 'PASS' ? '✅' : '❌';
  const msg = `${icon} [${section}] ${op}: ${detail}`;
  console.log(msg);
  results.push({ status, section, op, detail });
  if (status === 'PASS') passed++; else failed++;
}

async function main() {
  // ========== الأعداد الأولية ==========
  const { count: evCount0 } = await sb.from('events').select('*', { count: 'exact', head: true });
  const { count: brCount0 } = await sb.from('brands').select('*', { count: 'exact', head: true });
  const { count: prCount0 } = await sb.from('projects').select('*', { count: 'exact', head: true });

  console.log('\n=== الأعداد الأولية ===');
  console.log(`events: ${evCount0} | brands: ${brCount0} | projects: ${prCount0}`);
  console.log('');

  // جلب براند صالح للاختبار
  const { data: brandsList } = await sb.from('brands').select('id, name, icon').eq('status', 'active').limit(1);
  const testBrand = brandsList?.[0];
  console.log(`براند الاختبار: ${testBrand?.icon} ${testBrand?.name} (${testBrand?.id})\n`);

  // ========== 1. التقويم (events جدول) ==========
  console.log('=== 1. اختبار التقويم ===');
  
  // 1.1 تحميل البيانات
  const { data: evAll, count: evLoadCount } = await sb.from('events').select('*', { count: 'exact' });
  log('PASS', 'التقويم', 'تحميل', `${evLoadCount} حدث — مطابق للأصل (${evCount0})`);
  
  // 1.2 إضافة حدث تجريبي
  const testDate = { day: 14, month: 3, year: 2026 }; // أبريل = شهر 3 (0-indexed)
  const { data: evNew, error: evAddErr } = await sb.from('events').insert({
    id: `test_cal_${Date.now()}`,
    title: 'TEST_CALENDAR_BATCH2',
    day: testDate.day,
    month: testDate.month,
    year: testDate.year,
    type: 'general',
    brand_id: testBrand?.id || null
  }).select().single();
  
  if (evAddErr) {
    log('FAIL', 'التقويم', 'إضافة', evAddErr.message);
  } else {
    log('PASS', 'التقويم', 'إضافة', `ID: ${evNew.id} | العنوان: ${evNew.title} | التاريخ: ${evNew.day}/${evNew.month+1}/${evNew.year}`);
  }

  // 1.3 التحقق من الحفظ في Supabase
  if (evNew) {
    const { data: evCheck } = await sb.from('events').select('*').eq('id', evNew.id).single();
    if (evCheck?.title === 'TEST_CALENDAR_BATCH2') {
      log('PASS', 'التقويم', 'تحقق الحفظ', `الحدث موجود في Supabase — ID: ${evCheck.id}`);
    } else {
      log('FAIL', 'التقويم', 'تحقق الحفظ', 'الحدث غير موجود!');
    }

    // 1.4 تعديل
    const { data: evUpd, error: evUpdErr } = await sb.from('events')
      .update({ title: 'TEST_CALENDAR_BATCH2_UPDATED' })
      .eq('id', evNew.id).select().single();
    if (evUpdErr) {
      log('FAIL', 'التقويم', 'تعديل', evUpdErr.message);
    } else {
      log('PASS', 'التقويم', 'تعديل', `العنوان الجديد: "${evUpd.title}"`);
    }

    // 1.5 حذف
    const { error: evDelErr } = await sb.from('events').delete().eq('id', evNew.id);
    if (evDelErr) {
      log('FAIL', 'التقويم', 'حذف', evDelErr.message);
    } else {
      // تأكيد الحذف
      const { data: evGone } = await sb.from('events').select('id').eq('id', evNew.id).single();
      if (!evGone) {
        log('PASS', 'التقويم', 'حذف', `ID: ${evNew.id} محذوف من Supabase ✓`);
      } else {
        log('FAIL', 'التقويم', 'حذف', 'الحدث لا يزال موجوداً!');
      }
    }
  }

  // التحقق من العدد النهائي
  const { count: evCountFinal } = await sb.from('events').select('*', { count: 'exact', head: true });
  if (evCountFinal === evCount0) {
    log('PASS', 'التقويم', 'سلامة البيانات', `العدد النهائي ${evCountFinal} = الأصلي ${evCount0} ✓`);
  } else {
    log('FAIL', 'التقويم', 'سلامة البيانات', `العدد النهائي ${evCountFinal} ≠ الأصلي ${evCount0}!`);
  }

  // ========== 2. الأحداث (events — نفس الجدول لكن نوع مختلف) ==========
  console.log('\n=== 2. اختبار قسم الأحداث ===');
  
  // الأحداث تستخدم نفس جدول events لكن بـ type مختلف
  const { data: evTypeAll } = await sb.from('events').select('*');
  const eventTypes = [...new Set(evTypeAll?.map(e => e.type))];
  log('PASS', 'الأحداث', 'تحميل', `${evTypeAll?.length} حدث — أنواع: ${eventTypes.join(', ')}`);

  // إضافة حدث من نوع meeting
  const { data: evMeet, error: evMeetErr } = await sb.from('events').insert({
    id: `test_ev_${Date.now()}`,
    title: 'TEST_EVENT_MEETING_BATCH2',
    day: 15,
    month: 3,
    year: 2026,
    type: 'meeting',
    brand_id: testBrand?.id || null
  }).select().single();

  if (evMeetErr) {
    log('FAIL', 'الأحداث', 'إضافة', evMeetErr.message);
  } else {
    log('PASS', 'الأحداث', 'إضافة', `ID: ${evMeet.id} | النوع: ${evMeet.type}`);
  }

  if (evMeet) {
    // تعديل
    const { data: evMeetUpd, error: evMeetUpdErr } = await sb.from('events')
      .update({ title: 'TEST_EVENT_MEETING_UPDATED', type: 'deadline' })
      .eq('id', evMeet.id).select().single();
    if (evMeetUpdErr) {
      log('FAIL', 'الأحداث', 'تعديل', evMeetUpdErr.message);
    } else {
      log('PASS', 'الأحداث', 'تعديل', `العنوان: "${evMeetUpd.title}" | النوع: ${evMeetUpd.type}`);
    }

    // حذف
    const { error: evMeetDelErr } = await sb.from('events').delete().eq('id', evMeet.id);
    if (evMeetDelErr) {
      log('FAIL', 'الأحداث', 'حذف', evMeetDelErr.message);
    } else {
      const { data: gone } = await sb.from('events').select('id').eq('id', evMeet.id).single();
      log(gone ? 'FAIL' : 'PASS', 'الأحداث', 'حذف', gone ? 'لا يزال موجوداً!' : `ID: ${evMeet.id} محذوف ✓`);
    }
  }

  // ========== 3. البراندات ==========
  console.log('\n=== 3. اختبار البراندات ===');

  const { data: brAll, count: brLoadCount } = await sb.from('brands').select('*', { count: 'exact' });
  log('PASS', 'البراندات', 'تحميل', `${brLoadCount} براند — الأصلي: ${brCount0}`);

  // إضافة براند تجريبي
  const testBrandId = `test_br_${Date.now()}`;
  const { data: brNew, error: brAddErr } = await sb.from('brands').insert({
    id: testBrandId,
    name: 'TEST_BRAND_BATCH2',
    name_en: 'Test Brand Batch2',
    color: '#ff5500',
    icon: '🧪',
    status: 'active',
    health_score: 0,
    created_at: new Date().toISOString().split('T')[0],
    description: 'براند تجريبي للاختبار',
    production_days: 7,
    nav_order: 99
  }).select().single();

  if (brAddErr) {
    log('FAIL', 'البراندات', 'إضافة', brAddErr.message);
  } else {
    log('PASS', 'البراندات', 'إضافة', `ID: ${brNew.id} | الاسم: ${brNew.name} | الأيقونة: ${brNew.icon}`);
  }

  if (brNew) {
    // تحقق من الحفظ
    const { data: brCheck } = await sb.from('brands').select('*').eq('id', brNew.id).single();
    log(brCheck ? 'PASS' : 'FAIL', 'البراندات', 'تحقق الحفظ', brCheck ? `موجود في Supabase: ${brCheck.name}` : 'غير موجود!');

    // تعديل
    const { data: brUpd, error: brUpdErr } = await sb.from('brands')
      .update({ name: 'TEST_BRAND_BATCH2_UPDATED', status: 'paused' })
      .eq('id', brNew.id).select().single();
    if (brUpdErr) {
      log('FAIL', 'البراندات', 'تعديل', brUpdErr.message);
    } else {
      log('PASS', 'البراندات', 'تعديل', `الاسم: "${brUpd.name}" | الحالة: ${brUpd.status}`);
    }

    // حذف
    const { error: brDelErr } = await sb.from('brands').delete().eq('id', brNew.id);
    if (brDelErr) {
      log('FAIL', 'البراندات', 'حذف', brDelErr.message);
    } else {
      const { data: brGone } = await sb.from('brands').select('id').eq('id', brNew.id).single();
      log(brGone ? 'FAIL' : 'PASS', 'البراندات', 'حذف', brGone ? 'لا يزال موجوداً!' : `ID: ${brNew.id} محذوف ✓`);
    }
  }

  const { count: brCountFinal } = await sb.from('brands').select('*', { count: 'exact', head: true });
  log(brCountFinal === brCount0 ? 'PASS' : 'FAIL', 'البراندات', 'سلامة البيانات',
    `العدد النهائي ${brCountFinal} ${brCountFinal === brCount0 ? '=' : '≠'} الأصلي ${brCount0}`);

  // ========== 4. المشاريع ==========
  console.log('\n=== 4. اختبار المشاريع ===');

  const { data: prAll, count: prLoadCount } = await sb.from('projects').select('*', { count: 'exact' });
  log('PASS', 'المشاريع', 'تحميل', `${prLoadCount} مشروع — الأصلي: ${prCount0}`);

  // إضافة مشروع تجريبي
  const testPrId = `test_pr_${Date.now()}`;
  const { data: prNew, error: prAddErr } = await sb.from('projects').insert({
    id: testPrId,
    title: 'TEST_PROJECT_BATCH2',
    brand_id: testBrand?.id || null,
    status: 'planning',
    priority: 'medium',
    description: 'مشروع تجريبي للاختبار',
    tags: ['test', 'batch2'],
    progress: 0,
    sort_order: 999
  }).select().single();

  if (prAddErr) {
    log('FAIL', 'المشاريع', 'إضافة', prAddErr.message);
  } else {
    log('PASS', 'المشاريع', 'إضافة', `ID: ${prNew.id} | العنوان: ${prNew.title} | البراند: ${prNew.brand_id}`);
  }

  if (prNew) {
    // تحقق من الحفظ
    const { data: prCheck } = await sb.from('projects').select('*, brands(name, icon)').eq('id', prNew.id).single();
    log(prCheck ? 'PASS' : 'FAIL', 'المشاريع', 'تحقق الحفظ',
      prCheck ? `موجود — براند: ${prCheck.brands?.icon} ${prCheck.brands?.name}` : 'غير موجود!');

    // تعديل
    const { data: prUpd, error: prUpdErr } = await sb.from('projects')
      .update({ title: 'TEST_PROJECT_BATCH2_UPDATED', status: 'active', progress: 25 })
      .eq('id', prNew.id).select().single();
    if (prUpdErr) {
      log('FAIL', 'المشاريع', 'تعديل', prUpdErr.message);
    } else {
      log('PASS', 'المشاريع', 'تعديل', `العنوان: "${prUpd.title}" | الحالة: ${prUpd.status} | التقدم: ${prUpd.progress}%`);
    }

    // حذف
    const { error: prDelErr } = await sb.from('projects').delete().eq('id', prNew.id);
    if (prDelErr) {
      log('FAIL', 'المشاريع', 'حذف', prDelErr.message);
    } else {
      const { data: prGone } = await sb.from('projects').select('id').eq('id', prNew.id).single();
      log(prGone ? 'FAIL' : 'PASS', 'المشاريع', 'حذف', prGone ? 'لا يزال موجوداً!' : `ID: ${prNew.id} محذوف ✓`);
    }
  }

  const { count: prCountFinal } = await sb.from('projects').select('*', { count: 'exact', head: true });
  log(prCountFinal === prCount0 ? 'PASS' : 'FAIL', 'المشاريع', 'سلامة البيانات',
    `العدد النهائي ${prCountFinal} ${prCountFinal === prCount0 ? '=' : '≠'} الأصلي ${prCount0}`);

  // ========== 5. الترابط ==========
  console.log('\n=== 5. اختبار الترابط ===');

  // مشاريع مرتبطة ببراند
  const { data: prLinked } = await sb.from('projects')
    .select('id, title, brand_id, brands(name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  const prLinkedCount = prLinked?.filter(p => p.brands?.name).length || 0;
  log(prLinkedCount > 0 ? 'PASS' : 'FAIL', 'الترابط', 'مشاريع ↔ براندات',
    `${prLinkedCount}/${prLinked?.length} مشروع مرتبط ببراند صحيح`);
  prLinked?.slice(0,3).forEach(p => console.log(`   - "${p.title}" → ${p.brands?.icon} ${p.brands?.name}`));

  // أحداث مرتبطة ببراند
  const { data: evLinked } = await sb.from('events')
    .select('id, title, brand_id, brands(name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  const evLinkedCount = evLinked?.filter(e => e.brands?.name).length || 0;
  log(evLinkedCount > 0 ? 'PASS' : 'FAIL', 'الترابط', 'أحداث ↔ براندات',
    `${evLinkedCount}/${evLinked?.length} حدث مرتبط ببراند صحيح`);
  evLinked?.slice(0,3).forEach(e => console.log(`   - "${e.title}" → ${e.brands?.icon} ${e.brands?.name}`));

  // مهام مرتبطة ببراند
  const { data: tasksLinked } = await sb.from('tasks')
    .select('id, title, brand_id, brands(name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  const tasksLinkedCount = tasksLinked?.filter(t => t.brands?.name).length || 0;
  log(tasksLinkedCount > 0 ? 'PASS' : 'FAIL', 'الترابط', 'مهام ↔ براندات',
    `${tasksLinkedCount}/${tasksLinked?.length} مهمة مرتبطة ببراند صحيح`);
  tasksLinked?.slice(0,3).forEach(t => console.log(`   - "${t.title}" → ${t.brands?.icon} ${t.brands?.name}`));

  // قرارات مرتبطة ببراند
  const { data: decisLinked } = await sb.from('decisions')
    .select('id, title, brand_id, brands(name, icon)')
    .not('brand_id', 'is', null)
    .limit(5);
  const decisLinkedCount = decisLinked?.filter(d => d.brands?.name).length || 0;
  log(decisLinkedCount > 0 ? 'PASS' : 'FAIL', 'الترابط', 'قرارات ↔ براندات',
    `${decisLinkedCount}/${decisLinked?.length} قرار مرتبط ببراند صحيح`);
  decisLinked?.slice(0,3).forEach(d => console.log(`   - "${d.title}" → ${d.brands?.icon} ${d.brands?.name}`));

  // ========== ملخص ==========
  console.log('\n' + '='.repeat(50));
  console.log(`الملخص: ${passed} ✅ ناجح | ${failed} ❌ فاشل`);
  console.log('='.repeat(50));
}

main().catch(console.error);
