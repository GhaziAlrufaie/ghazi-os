// Server Component — Projects Page (Master Aggregator)
// Fetches ALL tasks from the same `tasks` table as Brands + all brands for filter
import { getTasks } from '@/lib/tasks-actions';
import { getBrands } from '@/lib/brands-actions';
import ProjectsClient from '@/components/projects/ProjectsClient';
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [tasks, brands] = await Promise.all([getTasks(), getBrands()]);
  return <ProjectsClient initialTasks={tasks} brands={brands} />;
}
