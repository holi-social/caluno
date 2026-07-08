'use client';

import { Button } from '@repo/ui';
import { Eye, Share2, SquarePen, Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link } from '@/i18n/navigation';
import { copyToClipboard } from '@/lib/clipboard';
import { EVENT_FORM_SHEET, EVENT_INVITE_SHEET } from '../constants';
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
  const editSheet = useSheetTrigger(EVENT_FORM_SHEET);
  const inviteSheet = useSheetTrigger(EVENT_INVITE_SHEET);

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
          <Button
            size="icon-xs"
            variant="outline"
            aria-label={t('action.editAria')}
            onClick={() => editSheet.open({ id })}
          >
            <SquarePen />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            aria-label={t('action.inviteAria')}
            onClick={() => inviteSheet.open({ id })}
          >
            <UserPlus />
          </Button>
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
