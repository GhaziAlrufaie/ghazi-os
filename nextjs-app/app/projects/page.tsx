// Server Component — Projects Page (بنك الأفكار المركزي)
// Fetches ONLY ideas/projects status tasks — keeps the board clean and focused
import { getIdeasTasks } from '@/lib/tasks-actions';
import { getBrands } from '@/lib/brands-actions';
import ProjectsClient from '@/components/projects/ProjectsClient';
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [tasks, brands] = await Promise.all([getIdeasTasks(), getBrands()]);
  return <ProjectsClient initialTasks={tasks} brands={brands} />;
}
