/**
 * salla-api.ts
 * هيكل Salla API لنظام الجوزاء — جاهز للتفعيل بمجرد إدخال OAuth Tokens
 *
 * ⚠️ لتفعيل هذا الملف:
 * 1. أنشئ تطبيقاً في: https://salla.partners/
 * 2. أضف في Vercel Environment Variables:
 *    - SALLA_CLIENT_ID
 *    - SALLA_CLIENT_SECRET
 *    - SALLA_ACCESS_TOKEN (بعد OAuth)
 *    - SALLA_REFRESH_TOKEN (بعد OAuth)
 * 3. استبدل MOCK_MODE = false
 */

import type { JawzaDailySnapshot } from './claude-ai';

// ===== الإعدادات =====

const SALLA_API_BASE = 'https://api.salla.dev/admin/v2';
const MOCK_MODE = true; // غيّر إلى false بعد ربط سلة

// ===== أنواع البيانات =====

export interface SallaOrder {
  id: number;
  reference_id: string;
  status: { name: string; slug: string };
  total: { amount: number; currency: string };
  customer: { id: number; name: string; mobile: string };
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: { amount: number };
  }>;
  created_at: string;
}

export interface SallaProduct {
  id: number;
  name: string;
  sku: string;
  price: { amount: number; currency: string };
  quantity: number;
  status: 'sale' | 'out' | 'hidden';
  images: Array<{ url: string }>;
  categories: Array<{ id: number; name: string }>;
}

export interface SallaCustomer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  city: string;
  orders_count: number;
  total_spent: number;
  created_at: string;
  last_order_at: string;
}

export interface SallaCart {
  id: string;
  customer: { name: string; mobile: string } | null;
  total: number;
  items_count: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  created_at: string;
}

export interface SallaAnalytics {
  revenue: number;
  orders_count: number;
  avg_order_value: number;
  new_customers: number;
  returning_customers: number;
}

// ===== Salla API Client =====

class SallaClient {
  private accessToken: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.accessToken = process.env.SALLA_ACCESS_TOKEN || '';
    this.refreshToken = process.env.SALLA_REFRESH_TOKEN || '';
    this.clientId = process.env.SALLA_CLIENT_ID || '';
    this.clientSecret = process.env.SALLA_CLIENT_SECRET || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (MOCK_MODE) {
      throw new Error('MOCK_MODE: Salla API not connected yet');
    }

    const response = await fetch(`${SALLA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // تجديد الـ token إذا انتهت صلاحيته
    if (response.status === 401) {
      await this.refreshAccessToken();
      return this.request<T>(endpoint, options);
    }

    if (!response.ok) {
      throw new Error(`Salla API error: ${response.status} ${endpoint}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /** تجديد Access Token */
  private async refreshAccessToken(): Promise<void> {
    const response = await fetch('https://accounts.salla.sa/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) throw new Error('Failed to refresh Salla token');

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    // TODO: حفظ الـ tokens الجديدة في Supabase
    console.log('Salla tokens refreshed successfully');
  }

  // ===== Orders =====

  async getOrders(params: {
    from?: string;
    to?: string;
    status?: string;
    per_page?: number;
  } = {}): Promise<SallaOrder[]> {
    const query = new URLSearchParams({
      per_page: String(params.per_page || 50),
      ...(params.from && { 'date[from]': params.from }),
      ...(params.to && { 'date[to]': params.to }),
      ...(params.status && { status: params.status }),
    });
    return this.request<SallaOrder[]>(`/orders?${query}`);
  }

  async getTodayOrders(): Promise<SallaOrder[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getOrders({ from: today, to: today });
  }

  // ===== Products =====

  async getProducts(params: { per_page?: number; status?: string } = {}): Promise<SallaProduct[]> {
    const query = new URLSearchParams({
      per_page: String(params.per_page || 100),
      ...(params.status && { status: params.status }),
    });
    return this.request<SallaProduct[]>(`/products?${query}`);
  }

  async getLowStockProducts(threshold = 10): Promise<SallaProduct[]> {
    const products = await this.getProducts();
    return products.filter(p => p.quantity <= threshold && p.status === 'sale');
  }

  async updateProductStock(productId: number, quantity: number): Promise<void> {
    await this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  // ===== Customers =====

  async getCustomers(params: { per_page?: number } = {}): Promise<SallaCustomer[]> {
    const query = new URLSearchParams({ per_page: String(params.per_page || 100) });
    return this.request<SallaCustomer[]>(`/customers?${query}`);
  }

  // ===== Abandoned Carts =====

  async getAbandonedCarts(): Promise<SallaCart[]> {
    return this.request<SallaCart[]>('/abandoned-carts');
  }

  async sendCartRecoveryMessage(cartId: string, discount?: number): Promise<void> {
    await this.request(`/abandoned-carts/${cartId}/recover`, {
      method: 'POST',
      body: JSON.stringify({ discount_percentage: discount }),
    });
  }

  // ===== Analytics =====

  async getDailyAnalytics(date: string): Promise<SallaAnalytics> {
    return this.request<SallaAnalytics>(`/analytics/summary?date=${date}`);
  }
}

// ===== Singleton Instance =====
export const sallaClient = new SallaClient();

// ===== دالة بناء الـ Snapshot اليومي =====

/**
 * بناء snapshot يومي من بيانات سلة
 * يستخدم Mock Data إذا لم يكن سلة مربوطاً
 */
export async function buildDailySnapshot(date?: string): Promise<JawzaDailySnapshot> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (MOCK_MODE) {
    return getMockSnapshot(targetDate);
  }

  try {
    const [orders, products] = await Promise.all([
      sallaClient.getTodayOrders(),
      sallaClient.getLowStockProducts(10),
    ]);

    const completedOrders = orders.filter(o =>
      ['completed', 'processing', 'shipped'].includes(o.status.slug)
    );

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total.amount, 0);
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // حساب المنتجات الأعلى مبيعاً
    const productSales: Record<string, { name: string; units: number; revenue: number }> = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, units: 0, revenue: 0 };
        }
        productSales[item.name].units += item.quantity;
        productSales[item.name].revenue += item.price.amount * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const abandonedCarts = await sallaClient.getAbandonedCarts();
    const abandonedValue = abandonedCarts.reduce((sum, c) => sum + c.total, 0);

    const customerIds = new Set(completedOrders.map(o => o.customer.id));
    const newCustomers = Math.round(customerIds.size * 0.4); // تقدير

    return {
      date: targetDate,
      totalOrders: completedOrders.length,
      totalRevenue,
      totalProfit: totalRevenue * 0.35, // تقدير هامش 35%
      avgOrderValue,
      newCustomers,
      returningCustomers: customerIds.size - newCustomers,
      abandonedCarts: abandonedCarts.length,
      abandonedValue,
      topProducts,
      lowStockProducts: products.map(p => ({
        name: p.name,
        stock: p.quantity,
        threshold: 10,
      })),
    };
  } catch (error) {
    console.error('Salla API failed, using mock data:', error);
    return getMockSnapshot(targetDate);
  }
}

// ===== Mock Data =====

export function getMockSnapshot(date: string): JawzaDailySnapshot {
  const dayOfMonth = new Date(date).getDate();
  // تغيير الأرقام بناءً على اليوم لجعل الـ mock أكثر واقعية
  const baseRevenue = 3000 + (dayOfMonth % 7) * 800;

  return {
    date,
    totalOrders: 8 + (dayOfMonth % 5),
    totalRevenue: baseRevenue,
    totalProfit: baseRevenue * 0.38,
    avgOrderValue: Math.round(baseRevenue / (8 + (dayOfMonth % 5))),
    newCustomers: 3 + (dayOfMonth % 3),
    returningCustomers: 5 + (dayOfMonth % 4),
    abandonedCarts: 4 + (dayOfMonth % 3),
    abandonedValue: 1200 + (dayOfMonth % 5) * 300,
    topProducts: [
      { name: 'عود الكمال', units: 12, revenue: 1800 },
      { name: 'مسك الجوزاء', units: 8, revenue: 1200 },
      { name: 'بخور الملوك', units: 6, revenue: 900 },
      { name: 'ورد الطائف', units: 5, revenue: 750 },
      { name: 'عنبر الشرق', units: 4, revenue: 600 },
    ],
    lowStockProducts: dayOfMonth % 3 === 0 ? [
      { name: 'عود الكمال', stock: 5, threshold: 10 },
      { name: 'مسك الجوزاء', stock: 3, threshold: 10 },
    ] : [],
    yesterdayRevenue: baseRevenue - 400 + (dayOfMonth % 3) * 200,
    lastWeekRevenue: baseRevenue - 600 + (dayOfMonth % 5) * 150,
    monthlyGoal: 80000,
    monthlyAchieved: baseRevenue * dayOfMonth * 0.85,
  };
}

// ===== OAuth Helper =====

/**
 * توليد رابط OAuth لربط متجر سلة
 * استخدم هذا الرابط في إعدادات التطبيق
 */
export function getSallaOAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SALLA_CLIENT_ID || 'YOUR_CLIENT_ID',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'offline_access',
  });
  return `https://accounts.salla.sa/oauth2/auth?${params}`;
}

/**
 * استبدال Authorization Code بـ Access Token
 */
export async function exchangeSallaCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://accounts.salla.sa/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.SALLA_CLIENT_ID || '',
      client_secret: process.env.SALLA_CLIENT_SECRET || '',
    }),
  });

  if (!response.ok) throw new Error('Failed to exchange Salla OAuth code');
  return response.json();
}
