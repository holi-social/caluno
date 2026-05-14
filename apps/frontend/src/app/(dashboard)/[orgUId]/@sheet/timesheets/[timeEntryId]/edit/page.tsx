import { notFound } from 'next/navigation';
import { updateTimeEntry } from '@/domain/time-entry/actions';
import { TimeEntryForm } from '@/domain/time-entry/components/time-entry-form';
import { getAvailableShiftsWithVolunteers } from '@/domain/time-entry/queries';
import { getDataClient } from '@/lib/data-client';

interface TimeEntryUpdatePageProps {
  params: Promise<{ orgUId: string; timeEntryId: string }>;
}

export default async function TimeEntryUpdatePage({
  params,
}: TimeEntryUpdatePageProps) {
  const { orgUId, timeEntryId } = await params;

  const data = await getDataClient(orgUId);
  const entry = await data.timeEntry.findById(timeEntryId);

  if (!entry) {
    notFound();
  }

  const { shifts, allVolunteers } =
    await getAvailableShiftsWithVolunteers(orgUId);

  return (
    <TimeEntryForm
      title="Edit Time Entry"
      description="Adjust the details of this Time Entry."
      organizationUnitId={orgUId}
      shiftInstances={shifts}
      volunteers={allVolunteers}
      mutate={updateTimeEntry.bind(null, entry.id)}
      initialValues={{
        shiftInstanceId: entry.shiftInstance.id,
        volunteerId: entry.volunteer.id,
        startedAt: new Date(entry.startedAt),
        endedAt: entry.endedAt ? new Date(entry.endedAt) : undefined,
        notes: entry.notes ?? undefined,
      }}
    />
  );
}
