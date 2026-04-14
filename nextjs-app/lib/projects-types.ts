// Projects types & constants (no 'use server' — safe to import anywhere)
export interface ProjectRow {
  id: string;
  brandId: string | null;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  tags: string[];
  sortOrder: number;
  updatedAt: string | null;
}

export const STATUS_LABELS: Record<string, string> = {
  planning: 'تخطيط',
  active: 'نشط',
  paused: 'متوقف',
  done: 'مكتمل',
  archived: 'مؤرشف',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
  critical: 'حرج',
};
