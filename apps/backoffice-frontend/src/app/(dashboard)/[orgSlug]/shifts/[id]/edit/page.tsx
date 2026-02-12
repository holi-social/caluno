import { notFound } from 'next/navigation';
import { ActionBar } from '@/domain/shift/components/action-bar';
import { EditShiftForm } from '@/domain/shift/components/edit-form';
import { getDataClient } from '@/lib/data-client';

interface EditShiftPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function EditShiftPage({ params }: EditShiftPageProps) {
  const { orgSlug, id } = await params;

  const data = await getDataClient();
  const shift = await data.shift.findById(id);

  if (!shift) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Shift</h1>
          <p className="text-muted-foreground">
            Edit shift and change volunteer invitations
          </p>
        </div>
        <ActionBar id={id} orgSlug={orgSlug} size="sm" hideEdit />
      </div>

      <div className="px-2 py-8">
        <EditShiftForm orgSlug={orgSlug} shift={shift} />
      </div>
    </div>
  );
}
