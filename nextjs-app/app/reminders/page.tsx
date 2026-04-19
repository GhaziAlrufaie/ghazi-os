import { getReminders, type Reminder } from '@/lib/reminders-actions';
import RemindersClient from '@/components/reminders/RemindersClient';

export default async function RemindersPage() {
  let reminders: Reminder[] = [];
  try { reminders = await getReminders(); } catch {}
  return <RemindersClient initialReminders={reminders} />;
}
