import { ActionBar } from '@/domain/shift/components/action-bar';
import { CreateShiftForm } from '@/domain/shift/components/create-form';

interface CreateShiftPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function EditShiftPage({ params }: CreateShiftPageProps) {
  const { orgSlug, id } = await params;

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
        {/* TODO: reuse for for editing */}
        <CreateShiftForm orgSlug={orgSlug} />
      </div>
    </div>
  );
}
