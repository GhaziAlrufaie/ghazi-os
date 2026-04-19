// /finance redirects to expenses content
import { getExpenseSections } from '@/lib/expenses-actions';
import type { ExpenseSection } from '@/lib/expenses-types';
import ExpensesClient from '@/components/expenses/ExpensesClient';
export const dynamic = 'force-dynamic';
export default async function FinancePage() {
  let sections: ExpenseSection[] = [];
  try { sections = await getExpenseSections(); } catch {}
  return <ExpensesClient sections={sections} />;
}
