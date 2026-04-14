export interface ExpenseItem {
  id: string;
  kind: 'fixed' | 'variable';
  name: string;
  amount: number;
  note?: string;
}

export interface ExpenseSection {
  id: string;
  title: string;
  type: string;
  color: string;
  items: ExpenseItem[];
  updated_at: string;
}

export interface MonthlyGoal {
  id: string;
  year: number;
  month: number;
  revenue_target: number;
  orders_target: number;
  new_customers_target: number;
  notes: string | null;
  created_at: string;
}

export const MONTH_NAMES: Record<number, string> = {
  1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل',
  5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس',
  9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر',
};
