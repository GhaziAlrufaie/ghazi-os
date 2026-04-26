export interface Employee {
  id: string;
  name: string;
  role: string;
  brand_ids: string[];
  salary_type: 'fixed' | 'per_unit' | 'freelance';
  salary_amount: number;
  salary_unit: string | null;
  reports_to: string | null;
  status: 'active' | 'inactive' | 'freelance';
  created_at: string;
  updated_at: string;
  // HR Dossier fields
  sop_url?: string | null;
  access_rights?: string | null;
  private_notes?: string | null;
  kudos?: number;
  warnings?: number;
  phone?: string | null;
  iban?: string | null;
}

export const SALARY_TYPE_LABELS: Record<string, string> = {
  fixed: 'راتب ثابت',
  per_unit: 'بالقطعة',
  freelance: 'فريلانسر',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  freelance: 'فريلانسر',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900 text-green-300',
  inactive: 'bg-red-900 text-red-300',
  freelance: 'bg-purple-900 text-purple-300',
};
