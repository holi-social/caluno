'use client';

import { Button } from '@repo/ui';
import { Edit, Eye, Share2, Trash } from 'lucide-react';
import Link from 'next/link';
import { copyToClipboard, shiftShareUrl } from '../share';

type ActionBarProps = {
  id: string;
  orgId: string;
  size?: 'xs' | 'sm' | 'lg';
  hideEdit?: boolean;
};

export const ActionBar = ({
  id,
  orgId,
  size = 'xs',
  hideEdit = false,
}: ActionBarProps) => {
  const buttonSize = `icon-${size}` as const;

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you wish to delete this shift and all it's timesheets?",
      )
    ) {
      // TODO: delete
    }
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
        <Link href={`/${orgId}/shifts/${id}/edit`} aria-label="Edit shift">
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
      >
        <Trash />
      </Button>
    </aside>
  );
};
