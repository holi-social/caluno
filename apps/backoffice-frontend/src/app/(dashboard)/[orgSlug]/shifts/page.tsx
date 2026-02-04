import { Button } from '@repo/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

interface ShiftsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ShiftsPage({ params }: ShiftsPageProps) {
  const { orgSlug } = await params;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shifts</h1>
          <p className="text-muted-foreground">
            Manage and view your organization&apos;s shifts
          </p>
        </div>
        <Link href={`/${orgSlug}/shifts/create`}>
          <Button>
            <PlusIcon className="mr-2 size-4" />
            Create Shift
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No shifts yet. Create your first shift to get started.
        </p>
      </div>
    </>
  );
}
