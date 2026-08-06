'use client';

import { Button } from '@repo/ui';
import { Edit, Loader2, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { ActionTooltip } from '@/components/action-tooltip';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { deleteTimeEntry } from '@/domain/time-entry/actions';
import { Link, useRouter } from '@/i18n/navigation';

type ActionBarProps = {
  id: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
};

export const ActionBar = ({
  id,
  organizationUnitId,
  size = 'sm',
}: ActionBarProps) => {
  const router = useRouter();
  const t = useTranslations('TimeEntry');

  const [isDeleting, startDeleteTransition] = useTransition();

  const buttonSize = `icon-${size}` as const;

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteTimeEntry({ id, organizationUnitId });
      if (result?.serverError) {
        toast.error(t('action.deleteError', { error: result.serverError }));
      } else {
        toast.success(t('action.deleteSuccess'));
        router.push(`/admin/${organizationUnitId}/timesheets`);
      }
    });
  };

  return (
    <aside className="space-x-2">
      <ActionTooltip label={t('action.editAria')}>
        <Link href={`/admin/${organizationUnitId}/timesheets/${id}/edit`}>
          <Button
            size={buttonSize}
            variant="outline"
            aria-label={t('action.editAria')}
          >
            <Edit />
          </Button>
        </Link>
      </ActionTooltip>
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
