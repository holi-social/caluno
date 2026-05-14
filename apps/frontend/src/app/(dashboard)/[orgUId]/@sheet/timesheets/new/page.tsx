import { createTimeEntry } from '@/domain/time-entry/actions';
import { TimeEntryForm } from '@/domain/time-entry/components/time-entry-form';
import { getAvailableShiftsWithVolunteers } from '@/domain/time-entry/queries';

interface CreateTimeEntryPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function CreateTimeEntryPage({
  params,
}: CreateTimeEntryPageProps) {
  const { orgUId } = await params;

  const { shifts, allVolunteers } =
    await getAvailableShiftsWithVolunteers(orgUId);

  return (
    <TimeEntryForm
      title="Add Time Entry"
      description="Record a new time entry for a volunteer shift session."
      organizationUnitId={orgUId}
      shiftInstances={shifts}
      volunteers={allVolunteers}
      mutate={createTimeEntry}
    />
  );
}
