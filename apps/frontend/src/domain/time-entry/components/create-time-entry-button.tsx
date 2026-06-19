import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export const CreateTimeEntryButton = ({ orgUId }: { orgUId: string }) => {
  return (
    <Link href={`/admin/${orgUId}/timesheets/new`}>
      <Button>
        <PlusIcon /> Add Time Entry
      </Button>
    </Link>
  );
};
