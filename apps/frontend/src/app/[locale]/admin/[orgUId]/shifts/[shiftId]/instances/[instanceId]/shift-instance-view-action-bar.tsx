'use client';

import { Button } from '@repo/ui';
import { Edit, Share2, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { FORM_ID as EDIT_SHIFT_INSTANCE_FORM_ID } from '@/components/sheets/shift-instance-sheet';
import { type ShiftListQuery } from '@/domain/shift/routes';
import { shiftShareUrl } from '@/domain/shift/share';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { copyToClipboard } from '@/lib/clipboard';

type ShiftInstanceViewActionBarProps = {
  shiftId: string;
  instanceId: string;
  organizationUnitId: string;
  size?: 'xs' | 'sm' | 'md';
  returnQuery: ShiftListQuery;
};

export function ShiftInstanceViewActionBar({
  shiftId,
  instanceId,
  size = 'sm',
}: ShiftInstanceViewActionBarProps) {
  const { open: openEditSheet } = useSheetTrigger(EDIT_SHIFT_INSTANCE_FORM_ID);
  const t = useTranslations('ShiftInstanceDetail');

  const buttonSize = `icon-${size}` as const;

  const handleShare = () => {
    void copyToClipboard(shiftShareUrl(shiftId, instanceId), t('action.shareSuccess'));
  };

  const handleEdit = () => {
    openEditSheet({ id: shiftId, instanceId });
  };

  const handleDelete = () => {
    toast.info(t('action.deleteNotImplemented'));
  };

  return (
    <aside className="flex gap-2">
      <Button
        size={buttonSize}
        variant="outline"
        aria-label={t('action.editAria')}
        onClick={handleEdit}
      >
        <Edit />
      </Button>

      <Button
        size={buttonSize}
        variant="outline"
        aria-label={t('action.shareAria')}
        onClick={handleShare}
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
          >
            <Trash />
          </Button>
        }
      />
    </aside>
  );
}
