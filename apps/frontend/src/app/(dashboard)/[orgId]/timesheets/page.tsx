import { CreateTimeEntrySheet } from '@/components/sheets/create-time-entry-sheet';
import { getAvailableShiftsWithVolunteers } from '@/domain/time-entry/queries';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { TimesheetsTable } from './timesheets-table';

interface TimesheetsPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function TimesheetsPage({ params }: TimesheetsPageProps) {
  const { orgId } = await params;

  const { org } = await requireOrgAccess(orgId);
  const data = await getDataClient(org.id);

  const timeEntries = await data.timeEntry.findAll();

  // Fetch available shifts with volunteers
  const { shifts, allVolunteers } = await getAvailableShiftsWithVolunteers(
    org.id,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheets</h1>
        </div>
        <CreateTimeEntrySheet shifts={shifts} allVolunteers={allVolunteers} />
      </div>

      <TimesheetsTable entries={timeEntries.items} organizationId={org.id} />
    </div>
  );
}
