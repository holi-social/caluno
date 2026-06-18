'use client';

import { Button } from '@repo/ui';
import { Edit, Eye, Loader2, Share2, Trash, UserPlus } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { FORM_ID } from '@/components/sheets/shift-sheet';
import { useSheet } from '@/hooks/use-sheet';
import { Link, useRouter } from '@/i18n/navigation';
import { copyToClipboard } from '@/lib/clipboard';
import { deleteShift } from '../actions';
import { shiftShareUrl } from '../share';

type ActionBarProps = {
  id: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
  hideEdit?: boolean;
};

export const ActionBar = ({
  id,
  organizationUnitId,
  size = 'xs',
  hideEdit = false,
}: ActionBarProps) => {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const editSheet = useSheet(FORM_ID, 'id');
  const inviteSheet = useSheet('invite-shift', 'id');

  const buttonSize = `icon-${size}` as const;

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteShift({ id, organizationUnitId });
      if (result?.serverError) {
        toast.error(`Failed to delete Shift. ${result.serverError}`);
      } else {
        toast.success('Successfully deleted Shift.');
        router.push(`/admin/${organizationUnitId}/shifts`);
      }
    });
  };

  return (
    <aside className="space-x-2">
      <Link href={shiftShareUrl(id)} aria-label="View shift" target="_blank">
        <Button size={buttonSize} variant="outline">
          <Eye />
        </Button>
      </Link>

      {!hideEdit && (
        <Button
          size={buttonSize}
          variant="outline"
          aria-label="Edit shift"
          onClick={() => editSheet.open({ id })}
        >
          <Edit />
        </Button>
      )}

      <Button
        size={buttonSize}
        variant="outline"
        aria-label="Invite volunteers"
        onClick={() => inviteSheet.open({ id })}
      >
        <UserPlus />
      </Button>

      <Button
        size={buttonSize}
        variant="outline"
        aria-label="Copy shift link to clipboard"
        onClick={() =>
          copyToClipboard(shiftShareUrl(id), 'Shift link copied to clipboard')
        }
      >
        <Share2 />
      </Button>

      <DeleteAlertDialog
        title="Delete shift"
        description="Are you sure you wish to delete this shift and all its timesheets?"
        onDelete={handleDelete}
        trigger={
          <Button
            size={buttonSize}
            variant="destructive"
            aria-label="Delete shift"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash />}
          </Button>
        }
      />
    </aside>
  );
};
