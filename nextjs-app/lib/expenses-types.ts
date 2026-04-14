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

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  living: 'معيشة',
  business: 'أعمال',
  debt: 'ديون',
  salaries: 'رواتب',
  utilities: 'مرافق',
  family: 'أسرة',
  other: 'أخرى',
};
