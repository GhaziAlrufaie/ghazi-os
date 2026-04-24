// Server Component — Projects Page
import { getProjects } from '@/lib/projects-actions';
import { getBrands } from '@/lib/brands-actions';
import ProjectsClient from '@/components/projects/ProjectsClient';
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const [projects, brands] = await Promise.all([getProjects(), getBrands()]);
  return <ProjectsClient initialProjects={projects} brands={brands} />;
}
