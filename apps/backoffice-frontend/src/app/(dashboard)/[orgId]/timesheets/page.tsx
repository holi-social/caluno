import { VolunteerSessionStatus } from '@repo/data';
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

  // Get organization and fetch submitted volunteer sessions
  const { org } = await requireOrgAccess(orgId);
  const data = await getDataClient(org.id);

  const sessions = await data.volunteerSession.findAll({
    status: VolunteerSessionStatus.Submitted,
  });

  // Fetch available shifts with volunteers
  const { shifts, allVolunteers } = await getAvailableShiftsWithVolunteers(
    org.id,
  );

  const hasSessions = sessions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheets</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve volunteer time submissions
          </p>
        </div>
        <CreateTimeEntrySheet shifts={shifts} allVolunteers={allVolunteers} />
      </div>

      {/* Timesheets table or empty state */}
      {hasSessions ? (
        <TimesheetsTable sessions={sessions} organizationId={org.id} />
      ) : (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No pending timesheets. All volunteer sessions have been reviewed.
          </p>
        </div>
      )}
    </div>
  );
}
