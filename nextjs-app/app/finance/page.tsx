// /finance — صفحة المالية الكاملة
// Kanban 5 أعمدة + Tabs (كل المهام / مشاريع مالية / المصاريف)
import { getTasks } from '@/lib/tasks-actions';
import { getProjects } from '@/lib/projects-actions';
import { getExpenseSections } from '@/lib/expenses-actions';
import { getBrands } from '@/lib/brands-actions';
import type { Task } from '@/lib/tasks-actions';
import type { ProjectRow } from '@/lib/projects-types';
import type { ExpenseSection } from '@/lib/expenses-types';
import type { BrandRow } from '@/lib/brands-types';
import FinanceClient from '@/components/finance/FinanceClient';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  let tasks: Task[] = [];
  let projects: ProjectRow[] = [];
  let expenses: ExpenseSection[] = [];
  let brands: BrandRow[] = [];

  try {
    [tasks, projects, expenses, brands] = await Promise.all([
      getTasks(),
      getProjects(),
      getExpenseSections(),
      getBrands(),
    ]);
  } catch (e) {
    console.error('Finance page error:', e);
  }

  return (
    <FinanceClient
      initialTasks={tasks}
      projects={projects}
      expenses={expenses}
      brands={brands}
    />
  );
}
