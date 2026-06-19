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
        router.push(`/admin/${organizationUnitId}/shifts`);
      }
    });
  };

  return (
    <aside className="space-x-2">
      <Link
        href={shiftShareUrl(id)}
        aria-label={t('action.viewAria')}
        target="_blank"
      >
        <Button size={buttonSize} variant="outline">
          <Eye />
        </Button>
      </Link>

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

      <Button
        size={buttonSize}
        variant="outline"
        aria-label={t('action.inviteAria')}
        onClick={() => inviteSheet.open({ id })}
      >
        <UserPlus />
      </Button>

      <Button
        size={buttonSize}
        variant="outline"
        aria-label={t('action.copyLinkAria')}
        onClick={() =>
          copyToClipboard(shiftShareUrl(id), tCommon('linkCopied'))
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
