import { notFound } from 'next/navigation';
import { ActionBar } from '@/domain/shift/components/action-bar';
import { EditShiftForm } from '@/domain/shift/components/edit-form';
import { getDataClient } from '@/lib/data-client';

interface EditShiftPageProps {
  params: Promise<{ orgId: string; shiftId: string }>;
}

export default async function EditShiftPage({ params }: EditShiftPageProps) {
  const { orgId, shiftId } = await params;

  const data = await getDataClient(orgId);
  const shift = await data.shift.findById(shiftId);

  if (!shift) {
    notFound();
  }

  const projects = await data.project.findAllByOrganizationId(orgId, {
    limit: 100,
  });

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Shift</h1>
          <p className="text-muted-foreground">
            Edit shift and change volunteer invitations
          </p>
        </div>
        <ActionBar id={shiftId} organizationId={orgId} size="sm" hideEdit />
      </div>

      <div className="px-2 py-8">
        <EditShiftForm orgId={orgId} shift={shift} projects={projects.items} />
      </div>
    </div>
  );
}
