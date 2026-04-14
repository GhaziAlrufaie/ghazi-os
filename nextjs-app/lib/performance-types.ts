// Types for /performance section
// Tables: metrics, jawza_monthly_goals, campaigns

export interface MetricRow {
  id: string;
  brand_id: string;
  date: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
  ad_spend: number;
  roas: number;
  custom_metrics: Record<string, number>;
  updated_at: string;
}

export interface MonthlyGoalRow {
  id: string;
  year: number;
  month: number;
  revenue_target: number;
  orders_target: number;
  new_customers_target: number;
  notes: string | null;
  created_at: string;
}

export interface CampaignRow {
  id: string;
  brand_id: string;
  title: string;
  type: string;
  status: 'active' | 'planned' | 'completed' | 'paused';
  start_date: string | null;
  end_date: string | null;
  budget: number;
  actual_spend: number;
  channels: string[];
  target_metrics: Record<string, number>;
  actual_metrics: Record<string, number>;
  tasks: string[];
  notes: string | null;
  updated_at: string;
}

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  active: 'نشطة',
  planned: 'مخططة',
  completed: 'مكتملة',
  paused: 'متوقفة',
};

export const MONTH_NAMES: Record<number, string> = {
  1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل',
  5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس',
  9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر',
};
