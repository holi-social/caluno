import { createTimeEntry } from '@/domain/time-entry/actions';
import { TimeEntryForm } from '@/domain/time-entry/components/time-entry-form';
import { getDataClient } from '@/lib/data-client';

interface CreateTimeEntryPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function CreateTimeEntryPage({
  params,
}: CreateTimeEntryPageProps) {
  const { orgUId } = await params;
  const data = await getDataClient(orgUId);

  const [shifts, allVolunteers] = await Promise.all([
    data.shift.findAll({ limit: 100, offset: 0 }),
    data.organization.findVolunteersByUnit(orgUId),
  ]);

  return (
    <TimeEntryForm
      title="Add Time Entry"
      description="Record a new time entry for a volunteer shift session."
      organizationUnitId={orgUId}
      shifts={shifts.items}
      volunteers={allVolunteers}
      mutate={createTimeEntry}
    />
  );
}
