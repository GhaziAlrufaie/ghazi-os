// Types for /leadership section
// Tables: decisions, employees, campaigns

export interface DecisionRow {
  id: string;
  brand_id: string | null;
  project_id: string | null;
  title: string;
  context: string | null;
  options: DecisionOption[];
  chosen_option_id: string | null;
  status: 'open' | 'decided' | 'archived';
  impact: 'low' | 'medium' | 'high' | 'critical';
  deadline: string | null;
  decided_at: string | null;
  decided_by: string | null;
  notes: string | null;
  updated_at: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
  estimatedCost?: number;
  estimatedRevenue?: number;
}

export interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  brand_ids: string[];
  salary_type: 'fixed' | 'per_unit' | 'commission' | 'volunteer';
  salary_amount: number;
  salary_unit: string | null;
  reports_to: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export const DECISION_STATUS_LABELS: Record<string, string> = {
  open: 'مفتوح',
  decided: 'تم القرار',
  archived: 'مؤرشف',
};

export const DECISION_IMPACT_LABELS: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
  critical: 'حرج',
};

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  on_leave: 'إجازة',
};
