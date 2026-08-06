'use client';

import { Button } from '@repo/ui';
import { Eye, Share2, SquarePen, Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ActionTooltip } from '@/components/action-tooltip';
import { ConfirmDialog } from '@/domain/requirement-form/components/confirm-dialog';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
      setIsDeleteDialogOpen(false);
    });
  };

  return (
    <aside className="flex items-center gap-1">
      <ActionTooltip label={t('action.viewAria')}>
        <Link href={eventDetailPath(orgUId, id)}>
          <Button
            size="icon-xs"
            variant="outline"
            aria-label={t('action.viewAria')}
          >
            <Eye />
          </Button>
        </Link>
      </ActionTooltip>

      {canEdit && (
        <>
          <ActionTooltip label={t('action.editAria')}>
            <Link href={`/admin/${orgUId}/events/${id}/edit`}>
              <Button
                size="icon-xs"
                variant="outline"
                aria-label={t('action.editAria')}
              >
                <SquarePen />
              </Button>
            </Link>
          </ActionTooltip>

          <ActionTooltip label={t('action.inviteAria')}>
            <Link href={`/admin/${orgUId}/events/${id}/invite`}>
              <Button
                size="icon-xs"
                variant="outline"
                aria-label={t('action.inviteAria')}
              >
                <UserPlus />
              </Button>
            </Link>
          </ActionTooltip>
        </>
      )}

      <ActionTooltip label={t('action.shareAria')}>
        <Button
          size="icon-xs"
          variant="outline"
          aria-label={t('action.shareAria')}
          onClick={handleShare}
        >
          <Share2 />
        </Button>
      </ActionTooltip>

      {canEdit && (
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title={t('deleteDialog.title')}
          description={t('deleteDialog.description')}
          confirmLabel={t('deleteDialog.confirm')}
          pending={isDeleting}
          onConfirm={handleDelete}
          trigger={
            <ActionTooltip label={t('action.deleteAria')}>
              <Button
                size="icon-xs"
                variant="destructive"
                aria-label={t('action.deleteAria')}
              >
                <Trash2 />
              </Button>
            </ActionTooltip>
          }
        />
      )}
    </aside>
  );
}
