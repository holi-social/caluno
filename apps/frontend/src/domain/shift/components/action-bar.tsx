'use client';

import { Button } from '@repo/ui';
import { Edit, Eye, Loader2, Share2, Trash, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  instanceId?: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
  hideEdit?: boolean;
  onDeleteSuccess?: () => void;
};

export const ActionBar = ({
  id,
  instanceId,
  organizationUnitId,
  size = 'xs',
  hideEdit = false,
  onDeleteSuccess,
}: ActionBarProps) => {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const editSheet = useSheet(FORM_ID, 'id');
  const inviteSheet = useSheet('invite-shift', 'id', 'instanceId');
  const t = useTranslations('Shift');
  const tCommon = useTranslations('Common');

  const buttonSize = `icon-${size}` as const;

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteShift({ id, organizationUnitId });
      if (result?.serverError) {
        toast.error(t('action.deleteError', { error: result.serverError }));
      } else {
        toast.success(t('action.deleteSuccess'));
        if (onDeleteSuccess) {
          onDeleteSuccess();
        } else {
          router.refresh();
        }
      }
    });
  };

  return (
    <aside className="space-x-2">
      <Button size={buttonSize} variant="outline" asChild>
        <Link
          href={shiftShareUrl(id, instanceId)}
          aria-label={t('action.viewAria')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Eye />
        </Link>
      </Button>

      {!hideEdit && (
        <Button
          size={buttonSize}
          variant="outline"
          aria-label={t('action.editAria')}
          onClick={() => editSheet.open({ id })}
        >
          <Edit />
        </Button>
      )}

      {instanceId && (
        <Button
          size={buttonSize}
          variant="outline"
          aria-label={t('action.inviteAria')}
          onClick={() => inviteSheet.open({ id, instanceId })}
        >
          <UserPlus />
        </Button>
      )}

      <Button
        size={buttonSize}
        variant="outline"
        aria-label={t('action.copyLinkAria')}
        onClick={() =>
          copyToClipboard(shiftShareUrl(id, instanceId), tCommon('linkCopied'))
        }
      >
        <Share2 />
      </Button>

      <DeleteAlertDialog
        title={t('action.deleteTitle')}
        description={t('action.deleteDescription')}
        onDelete={handleDelete}
        trigger={
          <Button
            size={buttonSize}
            variant="destructive"
            aria-label={t('action.deleteTitle')}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash />}
          </Button>
        }
      />
    </aside>
  );
};
