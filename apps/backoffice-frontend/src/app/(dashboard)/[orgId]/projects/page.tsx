import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { PaginationControls } from './pagination-controls';
import { ProjectsTable } from './projects-table';

interface ProjectsPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ProjectsPage({
  params,
  searchParams,
}: ProjectsPageProps) {
  const { orgId } = await params;
  const { page: pageParam } = await searchParams;

  // Parse page number safely, default to 1
  const currentPage = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Get organization and fetch projects
  const { org } = await requireOrgAccess(orgId);
  const data = await getDataClient();

  const result = await data.project.findAllByOrganizationId(org.id, {
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const hasProjects = result.pagination.total > 0;

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize volunteer projects
          </p>
        </div>
        <Button asChild>
          <Link href={`/${org.id}/projects/create`}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Project
          </Link>
        </Button>
      </div>

      {/* Projects table or empty state */}
      {hasProjects ? (
        <>
          <ProjectsTable projects={result.items} />
          {result.pagination.total > ITEMS_PER_PAGE && (
            <PaginationControls
              pagination={result.pagination}
              currentPage={currentPage}
            />
          )}
        </>
      ) : (
        <div className="text-muted-foreground">
          No projects yet. Create your first project to get started.
        </div>
      )}
    </div>
  );
}
