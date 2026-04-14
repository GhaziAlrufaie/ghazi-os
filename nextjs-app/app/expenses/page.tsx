import { getExpenseSections } from '@/lib/expenses-actions';
import ExpensesClient from '@/components/expenses/ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const sections = await getExpenseSections();
  return <ExpensesClient sections={sections} />;
}
