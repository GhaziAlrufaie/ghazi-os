// /finance — صفحة المالية المستقلة
// تعرض فقط المهام ذات category=financial — لا تعرض مهام البراندات
import { getFinanceTasks } from "@/lib/tasks-actions";
import { getExpenseSections } from "@/lib/expenses-actions";
import type { Task } from "@/lib/tasks-actions";
import type { ExpenseSection } from "@/lib/expenses-types";
import FinanceClient from "@/components/finance/FinanceClient";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  let tasks: Task[] = [];
  let expenses: ExpenseSection[] = [];

  try {
    [tasks, expenses] = await Promise.all([
      getFinanceTasks(),
      getExpenseSections(),
    ]);
  } catch (e) {
    console.error("Finance page error:", e);
  }

  return (
    <FinanceClient
      initialTasks={tasks}
      expenses={expenses}
    />
  );
}
