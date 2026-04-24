// Server Component — Projects Page
import { getProjects } from '@/lib/projects-actions';
import { getBrands } from '@/lib/brands-actions';
import { getProjectTypeTasks } from '@/lib/tasks-actions';
import ProjectsClient from '@/components/projects/ProjectsClient';
export const dynamic = 'force-dynamic';
export default async function ProjectsPage() {
  const [projects, brands, projectTypeTasks] = await Promise.all([
    getProjects(),
    getBrands(),
    getProjectTypeTasks(),
  ]);
  return (
    <ProjectsClient
      initialProjects={projects}
      brands={brands}
      initialProjectTypeTasks={projectTypeTasks}
    />
  );
}
