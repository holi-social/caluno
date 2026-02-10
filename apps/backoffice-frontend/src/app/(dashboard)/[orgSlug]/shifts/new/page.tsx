import { CreateShiftForm } from '@/domain/shift/components/create-form';

interface CreateShiftPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CreateShiftPage({
  params,
}: CreateShiftPageProps) {
  const { orgSlug } = await params;

  return (
    <div className="max-w-2xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold">New Shift</h1>
          <p className="text-muted-foreground">
            Create a new shift and invite volunteers
          </p>
        </div>
        <div className="px-2 py-8">
          <CreateShiftForm orgSlug={orgSlug} />
        </div>
      </div>
    </div>
  );
}
