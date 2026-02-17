import { CreateTimeEntrySheet } from '@/components/sheets/create-time-entry-sheet';
import { getAvailableShiftsWithVolunteers } from '@/domain/time-entry/queries';
import { requireOrgAccess } from '@/lib/org-context-server';

interface TimeEntriesPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function TimeEntriesPage({
  params,
}: TimeEntriesPageProps) {
  const { orgId } = await params;
  const { org } = await requireOrgAccess(orgId);

  // Fetch available shifts with volunteers
  const { shifts, allVolunteers } = await getAvailableShiftsWithVolunteers(
    org.id,
  );

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Entries</h1>
          <p className="text-muted-foreground mt-1">
            Manually create time entries for volunteer sessions
          </p>
        </div>
        <CreateTimeEntrySheet shifts={shifts} allVolunteers={allVolunteers} />
      </div>

      {/* Empty state for now */}
      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Use the &quot;Add Time Entry&quot; button above to manually create
          time entries. Select a shift, then fill in the time details.
        </p>
      </div>
    </div>
  );
}
