'use client';

import { Button } from '@repo/ui';
import { Edit, Share2, Trash } from 'lucide-react';
import Link from 'next/link';
import { copyToClipboard } from '../share';

type ActionBarProps = {
  id: string;
  orgSlug: string;
  size?: 'xs' | 'sm' | 'lg';
};

export const ActionBar = ({ id, orgSlug, size = 'xs' }: ActionBarProps) => {
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
      <Button
        size={buttonSize}
        variant="outline"
        aria-label="Copy shift link to clipboard"
        onClick={handleCopyToClipboard}
      >
        <Share2 />
      </Button>
      <Link href={`/${orgSlug}/shifts/${id}/edit`} aria-label="Edit shift">
        <Button size={buttonSize} variant="outline">
          <Edit />
        </Button>
      </Link>

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
