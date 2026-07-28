'use client';

import { Button } from '@repo/ui';
import { Edit, Loader2, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { FORM_ID } from '@/components/sheets/shift-sheet';
import { useSheet } from '@/hooks/use-sheet';
import { useRouter } from '@/i18n/navigation';
import { deleteShift } from '../actions';

type ActionBarProps = {
  id: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
  hideEdit?: boolean;
  onDeleteSuccess?: () => void;
};

export const ActionBar = ({
  id,
  organizationUnitId,
  size = 'xs',
  hideEdit = false,
  onDeleteSuccess,
}: ActionBarProps) => {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const editSheet = useSheet(FORM_ID, 'id');
  const t = useTranslations('Shift');

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
