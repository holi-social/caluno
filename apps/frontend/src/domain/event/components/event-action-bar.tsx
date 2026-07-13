'use client';

import { Button } from '@repo/ui';
import { Eye, Share2, SquarePen, Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { copyToClipboard } from '@/lib/clipboard';
import { eventDetailPath } from '../routes';
import { eventShareUrl } from '../share';

type EventActionBarProps = {
  id: string;
  slug: string;
  orgUId: string;
  canEdit: boolean;
};

export function EventActionBar({
  id,
  slug,
  orgUId,
  canEdit,
}: EventActionBarProps) {
  const t = useTranslations('Event');

  const handleShare = () => {
    copyToClipboard(eventShareUrl(slug), t('toast.linkCopied'));
  };

  return (
    <aside className="flex items-center gap-1">
      <Link href={eventDetailPath(orgUId, id)}>
        <Button
          size="icon-xs"
          variant="outline"
          aria-label={t('action.viewAria')}
        >
          <Eye />
        </Button>
      </Link>

      {canEdit && (
        <>
          <Link href={`/admin/${orgUId}/events/${id}/edit`}>
            <Button
              size="icon-xs"
              variant="outline"
              aria-label={t('action.editAria')}
            >
              <SquarePen />
            </Button>
          </Link>

          <Link href={`/admin/${orgUId}/events/${id}/invite`}>
            <Button
              size="icon-xs"
              variant="outline"
              aria-label={t('action.inviteAria')}
            >
              <UserPlus />
            </Button>
          </Link>
        </>
      )}

      <Button
        size="icon-xs"
        variant="outline"
        aria-label={t('action.shareAria')}
        onClick={handleShare}
      >
        <Share2 />
      </Button>

      {canEdit && (
        <Button
          size="icon-xs"
          variant="destructive"
          aria-label={t('action.deleteAria')}
        >
          <Trash2 />
        </Button>
      )}
    </aside>
  );
}
