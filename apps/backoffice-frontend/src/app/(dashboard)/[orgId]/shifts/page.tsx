import Link from 'next/link';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { PaginationControls } from './pagination-controls';
import { ShiftsTable } from './shifts-table';

interface ShiftsPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ page?: number }>;
}

export default async function ShiftsPage({
  params,
  searchParams,
}: ShiftsPageProps) {
  const { orgSlug } = await params;
  const { page } = await searchParams;

  const currentPage = page || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { org } = await requireOrgAccess(orgSlug);
  const data = await getDataClient(org.id);

  const result = await data.shift.findAll({
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const hasShifts = result.pagination.total > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shifts</h1>
        <p className="text-muted-foreground mt-1">
          Manage volunteer shifts across all projects
        </p>
      </div>

      {hasShifts ? (
        <>
          <ShiftsTable shifts={result.items} orgSlug={orgSlug} />
          {result.pagination.total > ITEMS_PER_PAGE && (
            <PaginationControls
              pagination={result.pagination}
              orgSlug={orgSlug}
              currentPage={currentPage}
            />
          )}
        </>
      ) : (
        <div className="text-muted-foreground">
          No shifts yet.{' '}
          <Link href={`/${orgSlug}/shifts/new`}>Create your first</Link> shift
          to get started.
        </div>
      )}
    </div>
  );
}
