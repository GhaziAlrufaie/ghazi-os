// Server Component — Inbox page (inbox_tasks)
export const dynamic = 'force-dynamic';

import { getInboxTasks } from '@/lib/inbox-actions';
import InboxClient from '@/components/inbox/InboxClient';

export default async function InboxPage() {
  const tasks = await getInboxTasks();

  return (
    <div className="h-full p-6 overflow-hidden">
      <InboxClient initialTasks={tasks} />
    </div>
  );
}
