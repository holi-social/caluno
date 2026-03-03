'use client';

import { Button } from '@repo/ui';
import { Edit, Eye, Loader2, Share2, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteShift } from '../actions';
import { copyToClipboard, shiftShareUrl } from '../share';

type ActionBarProps = {
  id: string;
  organizationId: string;
  size?: 'xs' | 'sm' | 'lg';
  hideEdit?: boolean;
};

export const ActionBar = ({
  id,
  organizationId,
  size = 'xs',
  hideEdit = false,
}: ActionBarProps) => {
  const router = useRouter();
  const [isDeleting, startTransition] = useTransition();

  const buttonSize = `icon-${size}` as const;

  const handleDelete = () => {
    if (
      !confirm(
        "Are you sure you wish to delete this shift and all it's timesheets?",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteShift({
        id,
        organizationId,
      });
      if (result?.serverError) {
        toast.error(`Failed to delete Shift. ${result.serverError}`);
      } else {
        toast.success('Successfully deleted Shift.');
        router.push(`/${organizationId}/shifts`);
      }
    });
  };

  const handleCopyToClipboard = () => {
    copyToClipboard(id);
  };

  return (
    <aside className="space-x-2">
      <Link href={shiftShareUrl(id)} aria-label="View shift">
        <Button size={buttonSize} variant="outline">
          <Eye />
        </Button>
      </Link>

      {!hideEdit && (
        <Link
          href={`/${organizationId}/shifts/${id}/edit`}
          aria-label="Edit shift"
        >
          <Button size={buttonSize} variant="outline">
            <Edit />
          </Button>
        </Link>
      )}

      <Button
        size={buttonSize}
        variant="outline"
        aria-label="Copy shift link to clipboard"
        onClick={handleCopyToClipboard}
      >
        <Share2 />
      </Button>

      <Button
        size={buttonSize}
        variant="destructive"
        aria-label="Delete shift"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="animate-spin" /> : <Trash />}
      </Button>
    </aside>
  );
};
