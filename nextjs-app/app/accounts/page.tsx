import { getExpenses, getMonthlyGoals } from '@/lib/accounts-actions';
import AccountsClient from '@/components/accounts/AccountsClient';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const [expenses, goals] = await Promise.all([
    getExpenses(),
    getMonthlyGoals(),
  ]);

  return <AccountsClient expenses={expenses} goals={goals} />;
}
