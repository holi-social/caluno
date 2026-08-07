import { notFound } from 'next/navigation';
import { EditShiftInstancePageContent } from '@/domain/shift/components/edit-shift-instance-page-content';

interface EditShiftInstancePageProps {
  params: Promise<{ orgUId: string; shiftId: string; instanceId: string }>;
}

export default async function EditShiftInstancePage({
  params,
}: EditShiftInstancePageProps) {
  const { orgUId, shiftId, instanceId } = await params;

  if (!orgUId || !shiftId || !instanceId) {
    notFound();
  }

  return (
    <EditShiftInstancePageContent
      orgUId={orgUId}
      shiftId={shiftId}
      instanceId={instanceId}
    />
  );
}
