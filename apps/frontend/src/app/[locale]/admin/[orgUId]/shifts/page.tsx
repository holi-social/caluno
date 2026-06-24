import { PermissionKey } from '@repo/data';
import { startOfWeek } from 'date-fns';
import { getTranslations } from 'next-intl/server';
import { Pagination } from '@/components/pagination';
import { ShiftSheet } from '@/components/sheets';
import { CreateShiftButton } from '@/domain/shift/components/create-shift-button';
import { EmptyShifts } from '@/domain/shift/components/empty-shifts';
import { ShiftTabSwitcher } from '@/domain/shift/components/shift-tab-switcher';
import { ShiftsTable } from '@/domain/shift/components/shifts-table';
import { WeeklyCalendar } from '@/domain/shift/components/weekly-calendar';
import { WeeklyCalendarNav } from '@/domain/shift/components/weekly-calendar-nav';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission } from '@/lib/permissions-server';

type ShiftViewType = 'weekplan' | 'shifts';

interface ShiftsPageProps {
  params: Promise<{ orgUId: string }>;
  searchParams: Promise<{ view?: ShiftViewType; page?: string; week?: string }>;
}

function parseWeekStart(param: string | null | undefined): Date {
  const base = param ? new Date(param) : new Date();
  const d = Number.isNaN(base.getTime()) ? new Date() : base;
  return startOfWeek(d, { weekStartsOn: 1 });
}

export default async function ShiftsPage({
  params,
  searchParams,
}: ShiftsPageProps) {
  const { orgUId } = await params;
  const { page, view = 'weekplan', week } = await searchParams;

  await requireOrgAccess(orgUId);
  const [canManage] = await checkPermission(orgUId, PermissionKey.ShiftEdit);

  const currentPage = Number.parseInt(page ?? '1', 10) || 1;
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const isWeekplan = view !== 'shifts';
  const weekStart = parseWeekStart(week);

  const t = await getTranslations('Shift');

  let tableContent = null;
  if (!isWeekplan) {
    const data = await getDataClient(orgUId);
    const result = await data.shift.findAll({ limit: ITEMS_PER_PAGE, offset });
    tableContent = { items: result.items, pagination: result.pagination };
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Page header */}
      <div>
        <h1 className="page-title mb-2">{t('page.title')}</h1>

        <div className="flex flex-col gap-2 lg:flex-row justify-between items-start">
          <ShiftTabSwitcher
            orgUId={orgUId}
            activeTab={isWeekplan ? 'weekplan' : 'shifts'}
            week={week}
          />
          {isWeekplan && (
            <WeeklyCalendarNav weekStart={weekStart} orgUId={orgUId} />
          )}

          <CreateShiftButton />
        </div>
      </div>

      {/* Content */}
      {isWeekplan ? (
        <WeeklyCalendar
          orgUId={orgUId}
          canManage={canManage}
          weekStart={weekStart}
        />
      ) : tableContent && tableContent.pagination.total > 0 ? (
        <>
          <ShiftsTable shifts={tableContent.items} orgUId={orgUId} />
          {tableContent.pagination.total > ITEMS_PER_PAGE && (
            <Pagination
              pagination={tableContent.pagination}
              url={`/admin/${orgUId}/shifts?view=shifts`}
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

      <ShiftSheet />
    </div>
  );
}
