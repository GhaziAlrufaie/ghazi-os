/**
 * saudi-calendar.ts
 * حساب أوقات "الكاش" السعودية — الرواتب، حساب المواطن، المواسم
 * جزء من نظام الجوزاء — المدير التنفيذي الافتراضي
 */

// ===== أنواع البيانات =====

export type CashLevel = 'peak' | 'high' | 'normal' | 'low';
export type Season =
  | 'ramadan' | 'eid_fitr' | 'eid_adha'
  | 'national_day' | 'founding_day'
  | 'summer' | 'back_to_school' | 'winter' | 'normal';

export interface SaudiDayContext {
  date: Date;
  gregorianDate: string;          // YYYY-MM-DD
  hijriDate: string;              // مثال: "15 رمضان 1446"
  hijriMonth: number;
  hijriDay: number;
  hijriYear: number;

  // حالة الكاش
  cashLevel: CashLevel;
  cashScore: number;              // 1-10 (10 = أعلى قوة شرائية)
  cashReason: string;             // شرح سبب مستوى الكاش

  // الراتب
  isSalaryDay: boolean;
  daysToSalary: number;           // كم يوم متبقي للراتب
  salaryDayThisMonth: number;     // اليوم الميلادي للراتب هذا الشهر

  // حساب المواطن
  isCitizenAccountDay: boolean;
  daysToNextCitizenAccount: number;

  // الموسم
  season: Season;
  seasonLabel: string;            // اسم الموسم بالعربي
  seasonUrgency: number;          // 1-10
  seasonDaysLeft: number;         // كم يوم متبقي للموسم

  // توصية تسويقية
  marketingRecommendation: string;
  bestTimeToPost: string;         // مثال: "8-10 مساءً"
}

// ===== ثوابت =====

// أيام الرواتب الحكومية السعودية (عادةً آخر أيام الشهر أو الـ 25)
const SALARY_DAY = 25; // اليوم الـ 25 من كل شهر ميلادي

// أيام حساب المواطن (ربع سنوي — يناير، أبريل، يوليو، أكتوبر)
const CITIZEN_ACCOUNT_MONTHS = [1, 4, 7, 10]; // يناير، أبريل، يوليو، أكتوبر
const CITIZEN_ACCOUNT_DAY = 10; // عادةً العاشر من الشهر

// ===== تحويل التاريخ الهجري =====

/**
 * تحويل تاريخ ميلادي إلى هجري (تقريبي — دقة ±1 يوم)
 * للدقة الكاملة يُستخدم Intl.DateTimeFormat
 */
export function toHijri(date: Date): { day: number; month: number; year: number; label: string } {
  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(date);

    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1446');
    const label = formatter.format(date);

    return { day, month, year, label };
  } catch {
    // fallback تقريبي
    const JD = Math.floor(date.getTime() / 86400000) + 2440588;
    const l = JD - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor(50 * l2 / 17719) +
              Math.floor(l2 / 5670) * Math.floor(43 * l2 / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor(17719 * j / 50) -
               Math.floor(j / 16) * Math.floor(15238 * j / 43) + 29;
    const month = Math.floor(24 * l3 / 709);
    const day = l3 - Math.floor(709 * month / 24);
    const year = 30 * n + j - 30;
    return { day, month, year, label: `${day}/${month}/${year}` };
  }
}

// ===== أسماء الأشهر الهجرية =====
const HIJRI_MONTHS: Record<number, string> = {
  1: 'محرم', 2: 'صفر', 3: 'ربيع الأول', 4: 'ربيع الثاني',
  5: 'جمادى الأولى', 6: 'جمادى الثانية', 7: 'رجب', 8: 'شعبان',
  9: 'رمضان', 10: 'شوال', 11: 'ذو القعدة', 12: 'ذو الحجة',
};

// ===== حساب الموسم =====

/**
 * تحديد الموسم بناءً على التاريخ الهجري والميلادي
 */
export function getSeason(
  gregorianDate: Date,
  hijriMonth: number,
  hijriDay: number
): { season: Season; label: string; urgency: number; daysLeft: number } {
  const month = gregorianDate.getMonth() + 1; // 1-12
  const day = gregorianDate.getDate();

  // رمضان (الشهر 9 هجري)
  if (hijriMonth === 9) {
    const daysLeft = 29 - hijriDay; // رمضان 29-30 يوم
    return {
      season: 'ramadan',
      label: 'رمضان المبارك',
      urgency: 9,
      daysLeft: Math.max(0, daysLeft),
    };
  }

  // عيد الفطر (1-15 شوال)
  if (hijriMonth === 10 && hijriDay <= 15) {
    return {
      season: 'eid_fitr',
      label: 'عيد الفطر',
      urgency: 10,
      daysLeft: 15 - hijriDay,
    };
  }

  // عيد الأضحى (1-15 ذو الحجة)
  if (hijriMonth === 12 && hijriDay <= 15) {
    return {
      season: 'eid_adha',
      label: 'عيد الأضحى',
      urgency: 10,
      daysLeft: 15 - hijriDay,
    };
  }

  // اليوم الوطني (23 سبتمبر ± 7 أيام)
  if (month === 9 && day >= 16 && day <= 30) {
    return {
      season: 'national_day',
      label: 'اليوم الوطني 🇸🇦',
      urgency: 8,
      daysLeft: 30 - day,
    };
  }

  // يوم التأسيس (22 فبراير ± 7 أيام)
  if (month === 2 && day >= 15 && day <= 28) {
    return {
      season: 'founding_day',
      label: 'يوم التأسيس',
      urgency: 7,
      daysLeft: 28 - day,
    };
  }

  // العودة للمدارس (أغسطس 15 - سبتمبر 15)
  if ((month === 8 && day >= 15) || (month === 9 && day <= 15)) {
    const daysLeft = month === 8 ? (31 - day) + 15 : 15 - day;
    return {
      season: 'back_to_school',
      label: 'العودة للمدارس',
      urgency: 7,
      daysLeft,
    };
  }

  // الصيف (يونيو - أغسطس 14)
  if (month >= 6 && (month < 8 || (month === 8 && day < 15))) {
    const daysLeft = month === 6 ? (30 - day) + 31 + 14 :
                     month === 7 ? (31 - day) + 14 : 14 - day;
    return {
      season: 'summer',
      label: 'موسم الصيف',
      urgency: 6,
      daysLeft,
    };
  }

  // الشتاء (ديسمبر - فبراير 14)
  if (month === 12 || month === 1 || (month === 2 && day < 15)) {
    const daysLeft = month === 12 ? (31 - day) + 31 + 14 :
                     month === 1 ? (31 - day) + 14 : 14 - day;
    return {
      season: 'winter',
      label: 'موسم الشتاء',
      urgency: 5,
      daysLeft,
    };
  }

  return { season: 'normal', label: 'موسم عادي', urgency: 5, daysLeft: 30 };
}

// ===== حساب مستوى الكاش =====

/**
 * حساب مستوى القوة الشرائية بناءً على اليوم من الشهر
 */
export function getCashLevel(
  dayOfMonth: number,
  isSalaryDay: boolean,
  isCitizenAccountDay: boolean,
  season: Season
): { level: CashLevel; score: number; reason: string } {
  let score = 5;
  let reasons: string[] = [];

  // يوم الراتب نفسه أو اليوم التالي
  if (isSalaryDay || dayOfMonth === SALARY_DAY || dayOfMonth === SALARY_DAY + 1) {
    score += 3;
    reasons.push('يوم الراتب');
  }
  // أسبوع بعد الراتب (26-31)
  else if (dayOfMonth > SALARY_DAY) {
    score += 2;
    reasons.push('بعد الراتب مباشرة');
  }
  // منتصف الشهر (10-20)
  else if (dayOfMonth >= 10 && dayOfMonth <= 20) {
    score -= 1;
    reasons.push('منتصف الشهر');
  }
  // قبل الراتب (21-24)
  else if (dayOfMonth >= 21 && dayOfMonth < SALARY_DAY) {
    score -= 2;
    reasons.push('قبل الراتب');
  }

  // حساب المواطن
  if (isCitizenAccountDay) {
    score += 2;
    reasons.push('حساب المواطن');
  }

  // تأثير الموسم
  const seasonBonus: Record<Season, number> = {
    eid_fitr: 3, eid_adha: 3, ramadan: 2,
    national_day: 2, founding_day: 1,
    back_to_school: 1, summer: 1, winter: 1, normal: 0,
  };
  score += seasonBonus[season] || 0;
  if (seasonBonus[season] > 0) reasons.push(`موسم ${season}`);

  // تطبيع النتيجة
  score = Math.min(10, Math.max(1, score));

  const level: CashLevel =
    score >= 8 ? 'peak' :
    score >= 6 ? 'high' :
    score >= 4 ? 'normal' : 'low';

  return {
    level,
    score,
    reason: reasons.join(' + ') || 'يوم عادي',
  };
}

// ===== حساب أيام الراتب =====

export function getSalaryInfo(date: Date): {
  isSalaryDay: boolean;
  daysToSalary: number;
  salaryDayThisMonth: number;
} {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const isSalaryDay = day === SALARY_DAY;

  let daysToSalary: number;
  if (day <= SALARY_DAY) {
    daysToSalary = SALARY_DAY - day;
  } else {
    // الراتب القادم الشهر المقبل
    const nextMonth = new Date(year, month + 1, SALARY_DAY);
    daysToSalary = Math.ceil((nextMonth.getTime() - date.getTime()) / 86400000);
  }

  return { isSalaryDay, daysToSalary, salaryDayThisMonth: SALARY_DAY };
}

// ===== حساب حساب المواطن =====

export function getCitizenAccountInfo(date: Date): {
  isCitizenAccountDay: boolean;
  daysToNextCitizenAccount: number;
} {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const isCitizenAccountDay =
    CITIZEN_ACCOUNT_MONTHS.includes(month) && day === CITIZEN_ACCOUNT_DAY;

  // إيجاد أقرب يوم حساب مواطن قادم
  let nextDate: Date | null = null;
  for (const m of CITIZEN_ACCOUNT_MONTHS) {
    const candidate = new Date(year, m - 1, CITIZEN_ACCOUNT_DAY);
    if (candidate > date) {
      nextDate = candidate;
      break;
    }
  }
  // إذا لم يوجد هذا العام، نأخذ يناير السنة القادمة
  if (!nextDate) {
    nextDate = new Date(year + 1, 0, CITIZEN_ACCOUNT_DAY);
  }

  const daysToNextCitizenAccount = Math.ceil(
    (nextDate.getTime() - date.getTime()) / 86400000
  );

  return { isCitizenAccountDay, daysToNextCitizenAccount };
}

// ===== التوصية التسويقية =====

export function getMarketingRecommendation(
  cashLevel: CashLevel,
  season: Season,
  dayOfWeek: number // 0=أحد, 5=جمعة, 6=سبت
): { recommendation: string; bestTimeToPost: string } {
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // الجمعة والسبت

  const timeMap: Record<CashLevel, string> = {
    peak: '7-9 مساءً (ذروة التسوق)',
    high: '8-10 مساءً',
    normal: '9-11 مساءً',
    low: '10 مساءً - 12 ليلاً',
  };

  const recMap: Record<Season, string> = {
    ramadan: 'ركّز على عروض ما بعد الإفطار والسحور — الطلبات تتضاعف بعد 9 مساءً',
    eid_fitr: 'الآن أو لا — أطلق عروض العيد فوراً، الكاش في ذروته',
    eid_adha: 'موسم الهدايا والعطور — ارفع المخزون وأطلق باقات الهدايا',
    national_day: 'استخدم ألوان العلم السعودي في المحتوى — الناس في مزاج احتفالي',
    founding_day: 'محتوى تراثي وعطور عربية أصيلة — الهوية السعودية في المقدمة',
    back_to_school: 'عروض "العودة بعطر جديد" — الطلاب والأمهات جمهورك الآن',
    summer: 'عطور خفيفة وإعلانات الإجازة — الناس في وضع الاسترخاء والتسوق',
    winter: 'عطور دافئة وبخور — موسم التجمعات والضيافة',
    normal: 'محتوى منتظم — ركّز على قصص العملاء والمنتجات الجديدة',
  };

  const cashRec: Record<CashLevel, string> = {
    peak: '💰 الكاش في ذروته — أطلق عروضك الكبيرة الآن',
    high: '📈 قوة شرائية عالية — وقت مناسب للعروض',
    normal: '📊 يوم عادي — محتوى تعليمي وبناء علاقة',
    low: '🔋 قبل الراتب — تذكيرات وقوائم أمنيات',
  };

  const recommendation = [
    cashRec[cashLevel],
    recMap[season],
    isWeekend ? '📅 نهاية الأسبوع — الناس متاحون أكثر' : '',
  ].filter(Boolean).join('\n');

  return {
    recommendation,
    bestTimeToPost: isWeekend
      ? `${timeMap[cashLevel]} (نهاية الأسبوع — تفاعل أعلى)`
      : timeMap[cashLevel],
  };
}

// ===== الدالة الرئيسية =====

/**
 * الدالة الرئيسية — تحسب كل السياق السعودي ليوم معين
 */
export function getSaudiDayContext(date: Date = new Date()): SaudiDayContext {
  const hijri = toHijri(date);
  const { season, label: seasonLabel, urgency: seasonUrgency, daysLeft: seasonDaysLeft } =
    getSeason(date, hijri.month, hijri.day);
  const { isSalaryDay, daysToSalary, salaryDayThisMonth } = getSalaryInfo(date);
  const { isCitizenAccountDay, daysToNextCitizenAccount } = getCitizenAccountInfo(date);
  const { level: cashLevel, score: cashScore, reason: cashReason } = getCashLevel(
    date.getDate(), isSalaryDay, isCitizenAccountDay, season
  );
  const { recommendation: marketingRecommendation, bestTimeToPost } =
    getMarketingRecommendation(cashLevel, season, date.getDay());

  const gregorianDate = date.toISOString().split('T')[0];
  const hijriDate = `${hijri.day} ${HIJRI_MONTHS[hijri.month] || ''} ${hijri.year}`;

  return {
    date,
    gregorianDate,
    hijriDate,
    hijriMonth: hijri.month,
    hijriDay: hijri.day,
    hijriYear: hijri.year,
    cashLevel,
    cashScore,
    cashReason,
    isSalaryDay,
    daysToSalary,
    salaryDayThisMonth,
    isCitizenAccountDay,
    daysToNextCitizenAccount,
    season,
    seasonLabel,
    seasonUrgency,
    seasonDaysLeft,
    marketingRecommendation,
    bestTimeToPost,
  };
}

// ===== أدوات مساعدة =====

/** تحقق إذا كان اليوم مناسباً للإطلاق الكبير */
export function isGoodLaunchDay(ctx: SaudiDayContext): boolean {
  return ctx.cashScore >= 7 || ctx.seasonUrgency >= 8;
}

/** احسب أفضل يوم للإطلاق في الأسبوع القادم */
export function getBestLaunchDayThisWeek(): SaudiDayContext {
  let best: SaudiDayContext | null = null;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const ctx = getSaudiDayContext(d);
    if (!best || ctx.cashScore + ctx.seasonUrgency > best.cashScore + best.seasonUrgency) {
      best = ctx;
    }
  }
  return best!;
}

/** ملخص نصي مختصر لليوم */
export function getDaySummary(ctx: SaudiDayContext): string {
  const cashEmoji = { peak: '💰', high: '📈', normal: '📊', low: '🔋' }[ctx.cashLevel];
  return `${cashEmoji} ${ctx.cashReason} | ${ctx.seasonLabel} | أفضل وقت: ${ctx.bestTimeToPost}`;
}
