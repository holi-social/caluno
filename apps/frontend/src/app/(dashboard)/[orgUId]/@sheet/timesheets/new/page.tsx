import { CreateTimeEntryForm } from '@/domain/time-entry/components/create-form';
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
    <CreateTimeEntryForm
      organizationUnitId={orgUId}
      shiftInstances={shifts}
      allVolunteers={allVolunteers}
    />
  );
}
