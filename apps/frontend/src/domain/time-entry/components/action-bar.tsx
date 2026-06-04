'use client';

import { Button } from '@repo/ui';
import { Edit, Loader2, Timer, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { closeTimeEntry, deleteTimeEntry } from '@/domain/time-entry/actions';

type ActionBarProps = {
  id: string;
  organizationUnitId: string;
  isOpen: boolean;
  size?: 'xs' | 'sm' | 'md';
};

export const ActionBar = ({
  id,
  organizationUnitId,
  isOpen,
  size = 'sm',
}: ActionBarProps) => {
  const router = useRouter();

  const [isDeleting, startDeleteTransition] = useTransition();
  const [isClosing, startCloseTransition] = useTransition();

  const buttonSize = `icon-${size}` as const;

  const handleClose = () => {
    startCloseTransition(async () => {
      const result = await closeTimeEntry({
        id,
        organizationUnitId,
        endedAt: new Date(),
      });
      if (result?.serverError) {
        toast.error(`Failed to close time entry. ${result.serverError}`);
      } else {
        toast.success('Time entry closed');
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteTimeEntry({ id, organizationUnitId });
      if (result?.serverError) {
        toast.error(`Failed to delete time entry. ${result.serverError}`);
      } else {
        toast.success('Time entry deleted');
        router.push(`/admin/${organizationUnitId}/timesheets`);
      }
    });
  };

  return (
    <aside className="space-x-2">
      {isOpen && (
        <Button
          size={buttonSize}
          variant="outline"
          aria-label="Close time entry"
          disabled={isClosing}
          onClick={handleClose}
        >
          {isClosing ? <Loader2 className="animate-spin" /> : <Timer />}
        </Button>
      )}

      <Link href={`/admin/${organizationUnitId}/timesheets/${id}/edit`}>
        <Button
          size={buttonSize}
          variant="outline"
          aria-label="Edit Time Entry"
        >
          <Edit />
        </Button>
      </Link>
      <DeleteAlertDialog
        title="Delete time entry"
        description="Are you sure you wish to delete this time entry?"
        onDelete={handleDelete}
        trigger={
          <Button
            size={buttonSize}
            variant="destructive"
            aria-label="Delete time entry"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash />}
          </Button>
        }
      />
    </aside>
  );
};
