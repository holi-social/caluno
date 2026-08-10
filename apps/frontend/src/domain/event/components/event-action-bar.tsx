'use client';

import { Button } from '@repo/ui';
import { Eye, Share2, SquarePen, Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
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
      <Link href={eventDetailPath(orgUId, id)}>
        <Button
          size="icon-xs"
          variant="outline"
          tooltip={t('action.viewAria')}
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
              tooltip={t('action.editAria')}
            >
              <SquarePen />
            </Button>
          </Link>

          <Link href={`/admin/${orgUId}/events/${id}/invite`}>
            <Button
              size="icon-xs"
              variant="outline"
              tooltip={t('action.inviteAria')}
            >
              <UserPlus />
            </Button>
          </Link>
        </>
      )}

      <Button
        size="icon-xs"
        variant="outline"
        tooltip={t('action.shareAria')}
        onClick={handleShare}
      >
        <Share2 />
      </Button>

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
            <Button
              size="icon-xs"
              variant="destructive"
              tooltip={t('action.deleteAria')}
            >
              <Trash2 />
            </Button>
          }
        />
      )}
    </aside>
  );
}
