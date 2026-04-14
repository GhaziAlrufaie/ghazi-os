// Server Component — Brands Page
import { getBrands } from '@/lib/brands-actions';
import BrandsClient from '@/components/brands/BrandsClient';
export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const brands = await getBrands();
  return <BrandsClient initialBrands={brands} />;
}
