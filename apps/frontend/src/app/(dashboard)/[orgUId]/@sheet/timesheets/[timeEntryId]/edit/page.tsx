import { notFound } from 'next/navigation';
import { updateTimeEntry } from '@/domain/time-entry/actions';
import { TimeEntryForm } from '@/domain/time-entry/components/time-entry-form';
import { getDataClient } from '@/lib/data-client';

interface TimeEntryUpdatePageProps {
  params: Promise<{ orgUId: string; timeEntryId: string }>;
}

export default async function TimeEntryUpdatePage({
  params,
}: TimeEntryUpdatePageProps) {
  const { orgUId, timeEntryId } = await params;
  const data = await getDataClient(orgUId);

  const [entry, shifts, allVolunteers] = await Promise.all([
    data.timeEntry.findById(timeEntryId),
    data.shift.findAll({ limit: 100, offset: 0 }),
    data.organization.findVolunteersByUnit(orgUId),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <TimeEntryForm
      title="Edit Time Entry"
      description="Adjust the details of this Time Entry."
      organizationUnitId={orgUId}
      shifts={shifts.items}
      volunteers={allVolunteers}
      mutate={updateTimeEntry.bind(null, entry.id)}
      initialValues={{
        shiftInstanceId: entry.shiftInstance.id,
        shiftId: entry.shiftInstance.master.id,
        volunteerId: entry.volunteer.id,
        startedAt: new Date(entry.startedAt),
        endedAt: entry.endedAt ? new Date(entry.endedAt) : undefined,
        notes: entry.notes ?? undefined,
      }}
    />
  );
}
