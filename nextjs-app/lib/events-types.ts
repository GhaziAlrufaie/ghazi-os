// Events types (no 'use server' — safe to import anywhere)
export interface EventRow {
  id: string;
  title: string;
  day: number;
  month: number;
  year: number;
  brandId: string | null;
  brandName: string | null;
  brandColor: string | null;
  type: string;
}
