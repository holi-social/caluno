'use client';

import { Button } from '@repo/ui';
import {
  Eye,
  Loader2,
  Share2,
  SquarePen,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { Link, useRouter } from '@/i18n/navigation';
import { copyToClipboard } from '@/lib/clipboard';
import { deleteEvent } from '../actions';
import { eventDetailPath, eventsListPath } from '../routes';
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
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleShare = () => {
    copyToClipboard(eventShareUrl(slug), t('toast.linkCopied'));
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteEvent.bind(null, orgUId, id)({});
      if (result.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success(t('toast.deleted'));
        router.push(eventsListPath(orgUId));
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5 border-t border-border px-4 pt-4 pb-4">
      <Button asChild size="sm" className="w-full text-sm">
        <Link href={eventDetailPath(orgUId, id)} className="flex-1 min-w-0">
          <Eye className="shrink-0" />
          <span className="min-w-0 truncate">{t('card.viewButton')}</span>
        </Link>
      </Button>

      {canEdit && (
        <>
          <Button
            asChild
            size="icon-sm"
            variant="outline"
            className="rounded-full"
            tooltip={t('action.editAria')}
          >
            <Link href={`/admin/${orgUId}/events/${id}/edit`}>
              <SquarePen />
            </Link>
          </Button>

          <Button
            asChild
            size="icon-sm"
            variant="outline"
            className="rounded-full"
            tooltip={t('action.inviteAria')}
          >
            <Link href={`/admin/${orgUId}/events/${id}/invite`}>
              <UserPlus />
            </Link>
          </Button>
        </>
      )}

      <Button
        size="icon-sm"
        variant="outline"
        className="rounded-full"
        tooltip={t('action.shareAria')}
        onClick={handleShare}
      >
        <Share2 />
      </Button>

      {canEdit && (
        <DeleteAlertDialog
          title={t('deleteDialog.title')}
          description={t('deleteDialog.description')}
          deleteLabel={t('deleteDialog.confirm')}
          onDelete={handleDelete}
          trigger={
            <Button
              size="icon-sm"
              variant="destructive"
              className="rounded-full"
              tooltip={t('action.deleteAria')}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          }
        />
      )}
    </div>
  );
}
