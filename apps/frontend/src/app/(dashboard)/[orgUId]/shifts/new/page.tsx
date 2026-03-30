import { CreateShiftForm } from '@/domain/shift/components/create-form';
import { getDataClient } from '@/lib/data-client';

interface NewShiftPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function CreateShiftPage({ params }: NewShiftPageProps) {
  const { orgUId } = await params;

  const _data = await getDataClient(orgUId);

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="page-title">New Shift</h1>
          <p className="text-muted-foreground">
            Create a new shift and invite volunteers
          </p>
        </div>
        <div className="px-2 py-8">
          <CreateShiftForm />
        </div>
      </div>
    </div>
  );
}
