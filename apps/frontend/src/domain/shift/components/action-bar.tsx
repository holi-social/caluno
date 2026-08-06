'use client';

import { Button } from '@repo/ui';
import { Edit, Loader2, Trash, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { ActionTooltip } from '@/components/action-tooltip';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { Link, useRouter } from '@/i18n/navigation';
import { deleteShift } from '../actions';
import { shiftEditPath } from '../routes';

type ActionBarProps = {
  id: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
  hideEdit?: boolean;
  editHref?: string;
  inviteHref?: string;
  onDeleteSuccess?: () => void;
};

export const ActionBar = ({
  id,
  organizationUnitId,
  size = 'xs',
  hideEdit = false,
  editHref,
  inviteHref,
  onDeleteSuccess,
}: ActionBarProps) => {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const t = useTranslations('Shift');

  const buttonSize = `icon-${size}` as const;
  const resolvedEditHref = editHref ?? shiftEditPath(organizationUnitId, id);

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
      {!hideEdit && (
        <ActionTooltip label={t('action.editAria')}>
          <Link href={resolvedEditHref}>
            <Button
              size={buttonSize}
              variant="outline"
              aria-label={t('action.editAria')}
            >
              <Edit />
            </Button>
          </Link>
        </ActionTooltip>
      )}

      {inviteHref && (
        <ActionTooltip label={t('action.inviteAria')}>
          <Link href={inviteHref}>
            <Button
              size={buttonSize}
              variant="outline"
              aria-label={t('action.inviteAria')}
            >
              <UserPlus />
            </Button>
          </Link>
        </ActionTooltip>
      )}

      <DeleteAlertDialog
        title={t('action.deleteTitle')}
        description={t('action.deleteDescription')}
        onDelete={handleDelete}
        trigger={
          <ActionTooltip label={t('action.deleteTitle')}>
            <Button
              size={buttonSize}
              variant="destructive"
              aria-label={t('action.deleteTitle')}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : <Trash />}
            </Button>
          </ActionTooltip>
        }
      />
    </aside>
  );
};
