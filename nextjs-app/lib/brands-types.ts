// Brands types & constants (no 'use server' — safe to import anywhere)
export interface BrandRow {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  icon: string;
  status: 'active' | 'paused' | 'archived';
  healthScore: number;
  description: string;
  productionDays: number;
  navOrder: number;
  mainTabLabel: string | null;
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  paused: 'متوقف',
  archived: 'مؤرشف',
};
