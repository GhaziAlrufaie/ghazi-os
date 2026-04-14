// Types for /sales section
// Tables: salla_orders, metrics (revenue summary)

export interface SallaOrderRow {
  id: number;
  salla_order_id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  items: OrderItem[];
  raw_payload: Record<string, unknown>;
  brand: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'معلّق',
  processing: 'قيد المعالجة',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refunded: 'مُسترد',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  processing: 'bg-blue-900 text-blue-300',
  shipped: 'bg-purple-900 text-purple-300',
  delivered: 'bg-green-900 text-green-300',
  cancelled: 'bg-red-900 text-red-300',
  refunded: 'bg-gray-700 text-gray-400',
};
