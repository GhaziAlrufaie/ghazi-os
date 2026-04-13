// Server Component — Inbox page
export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase';
import InboxClient from '@/components/inbox/InboxClient';
import type { InboxMessage, MessageSource, MessageStatus } from '@/lib/inbox-actions';

async function fetchMessages(): Promise<InboxMessage[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('daily_messages')
    .select('id,content,sender,source,status,brand_id,created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    content: row.content ?? '',
    sender: row.sender ?? '',
    source: (row.source ?? 'other') as MessageSource,
    status: (row.status ?? 'unread') as MessageStatus,
    brandId: row.brand_id ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  }));
}

async function fetchBrands() {
  const supabase = createServerClient();
  const { data } = await supabase.from('brands').select('id,name,color').order('name');
  return data ?? [];
}

export default async function InboxPage() {
  const [messages, brands] = await Promise.all([fetchMessages(), fetchBrands()]);

  return (
    <div className="h-full p-6 overflow-hidden">
      <InboxClient initialMessages={messages} brands={brands} />
    </div>
  );
}
