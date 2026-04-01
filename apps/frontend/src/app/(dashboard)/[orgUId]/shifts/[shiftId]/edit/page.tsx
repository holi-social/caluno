import { notFound } from 'next/navigation';
import { ActionBar } from '@/domain/shift/components/action-bar';
import { EditShiftForm } from '@/domain/shift/components/edit-form';
import { getDataClient } from '@/lib/data-client';

interface EditShiftPageProps {
  params: Promise<{ orgUId: string; shiftId: string }>;
}

export default async function EditShiftPage({ params }: EditShiftPageProps) {
  const { orgUId, shiftId } = await params;

  const data = await getDataClient(orgUId);
  const shift = await data.shift.findById(shiftId);

  if (!shift) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between">
        <div>
          <h1 className="page-title">Edit Shift</h1>
          <p className="text-muted-foreground">
            Edit shift and change volunteer invitations
          </p>
        </div>
        <ActionBar
          id={shiftId}
          organizationUnitId={orgUId}
          size="sm"
          hideEdit
        />
      </div>

      <div className="px-2 py-8">
        <EditShiftForm orgUId={orgUId} shift={shift} />
      </div>
    </div>
  );
}
