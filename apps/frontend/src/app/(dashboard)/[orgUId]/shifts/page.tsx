import { Pagination } from '@/components/pagination';
import { ShiftSheet } from '@/components/sheets';
import { CreateShiftButton } from '@/domain/shift/components/create-shift-button';
import { EmptyShifts } from '@/domain/shift/components/empty-shifts';
import { ShiftsTable } from '@/domain/shift/components/shifts-table';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface ShiftsPageProps {
  params: Promise<{ orgUId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ShiftsPage({
  params,
  searchParams,
}: ShiftsPageProps) {
  const { orgUId } = await params;
  const { page } = await searchParams;

  const currentPage = Number.parseInt(page ?? '1', 10) || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

  const result = await data.shift.findAll({
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const hasShifts = result.pagination.total > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Shifts</h1>
          <p className="text-muted-foreground mt-1">Manage volunteer shifts</p>
        </div>
        <CreateShiftButton />
        <ShiftSheet />
      </div>

      {hasShifts ? (
        <>
          <ShiftsTable shifts={result.items} orgUId={orgUId} />
          {result.pagination.total > ITEMS_PER_PAGE && (
            <Pagination
              pagination={result.pagination}
              url={`/${orgUId}/shifts`}
              currentPage={currentPage}
              name="shifts"
            />
          )}
        </>
      ) : (
        <EmptyShifts>
          <CreateShiftButton />
        </EmptyShifts>
      )}
    </div>
  );
}
