/**
 * Ghazi OS — Global In-Memory Cache
 * ─────────────────────────────────
 * يمنع تكرار Supabase requests عند التنقل بين الصفحات.
 * يُستخدم فقط للـ client-side components التي تجلب عند mount.
 *
 * الاستخدام:
 *   const data = await fetchCached('employees', () => supabase.from('employees').select('*'))
 *   invalidateCache('employees')  // عند الحفظ الصريح
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

// TTL: 5 minutes — بعدها يُعاد الجلب تلقائياً
const CACHE_TTL_MS = 5 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalCache = new Map<string, CacheEntry<any>>();

/**
 * جلب بيانات مع cache — يُعيد من الـ cache إذا كان حديثاً
 * @param key   مفتاح الـ cache (مثل 'employees', 'daily_routines')
 * @param fetcher دالة تُعيد البيانات من Supabase
 * @param forceRefresh true = تجاهل الـ cache وأعد الجلب
 */
export async function fetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  forceRefresh = false
): Promise<T> {
  const cached = globalCache.get(key);
  const now = Date.now();

  if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    // Cache hit — return instantly without network request
    return cached.data as T;
  }

  // Cache miss or expired — fetch from Supabase
  const data = await fetcher();
  globalCache.set(key, { data, timestamp: now });
  return data;
}

/**
 * إلغاء صلاحية الـ cache لمفتاح معين
 * يُستدعى بعد الحفظ الصريح لضمان جلب أحدث البيانات في المرة القادمة
 */
export function invalidateCache(key: string): void {
  globalCache.delete(key);
}

/**
 * إلغاء صلاحية جميع الـ cache entries
 */
export function invalidateAllCache(): void {
  globalCache.clear();
}

/**
 * فحص ما إذا كان الـ cache لمفتاح معين حديثاً
 */
export function isCacheValid(key: string): boolean {
  const cached = globalCache.get(key);
  if (!cached) return false;
  return (Date.now() - cached.timestamp) < CACHE_TTL_MS;
}
