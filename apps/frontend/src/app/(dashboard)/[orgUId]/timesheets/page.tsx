import { CreateTimeEntryButton } from '@/domain/time-entry/components/create-time-entry-button';
import { EmptyTimeEntries } from '@/domain/time-entry/components/empty-time-entries';
import { TimesheetsTable } from '@/domain/time-entry/components/timesheets-table';
import { getDataClient } from '@/lib/data-client';

interface TimesheetsPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function TimesheetsPage({ params }: TimesheetsPageProps) {
  const { orgUId } = await params;

  const data = await getDataClient(orgUId);

  const timeEntries = await data.timeEntry.findAll();
  const hasTimeEntries = timeEntries.pagination.total > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Timesheets</h1>
        <CreateTimeEntryButton orgUId={orgUId} />
      </div>

      {hasTimeEntries ? (
        <TimesheetsTable
          entries={timeEntries.items}
          organizationUnitId={orgUId}
        />
      ) : (
        <EmptyTimeEntries>
          <CreateTimeEntryButton orgUId={orgUId} />
        </EmptyTimeEntries>
      )}
    </div>
  );
}
