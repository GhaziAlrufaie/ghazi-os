// Ghazi OS — Legendary Edition
// قسم الأرشيف — Server Component يجلب البيانات من Supabase
// الهوية: #05070d | ذهبي #C9963B | RTL كامل

import { createClient } from '@supabase/supabase-js';
import ArchiveClient from '@/components/archive/ArchiveClient';

interface ArchiveEntry {
  id: string;
  type: string;
  reason: string;
  archived_at: string;
  archived_month: number | null;
  archived_year: number | null;
  data: Record<string, unknown>;
}

interface Brand {
  id: string;
  name: string;
  color: string;
  icon: string;
  status: string;
}

async function getArchiveData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [archiveRes, brandsRes] = await Promise.all([
    supabase
      .from('archive')
      .select('*')
      .order('archived_at', { ascending: false }),
    supabase
      .from('brands')
      .select('id, name, color, icon, status')
      .order('name'),
  ]);

  return {
    archive: (archiveRes.data ?? []) as ArchiveEntry[],
    brands: (brandsRes.data ?? []) as Brand[],
  };
}

export default async function ArchivePage() {
  const { archive, brands } = await getArchiveData();

  const archivedBrands = brands.filter((b) => b.status === 'archived');
  const activeBrands = brands.filter((b) => b.status !== 'archived');

  return (
    <ArchiveClient
      initialArchive={archive}
      archivedBrands={archivedBrands}
      activeBrands={activeBrands}
    />
  );
}
