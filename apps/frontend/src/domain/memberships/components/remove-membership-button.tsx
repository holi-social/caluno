'use client';

import { PermissionKey, useRemoveMembership } from '@repo/data/react';
import { Button } from '@repo/ui';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { RequirePermission } from '@/components/require-permission';

type Props = {
  membershipId: string;
  volunteerName: string;
  appearance?: 'icon' | 'labeled';
  onRemoved?: () => void;
};

export function RemoveMembershipButton({
  membershipId,
  volunteerName,
  appearance = 'icon',
  onRemoved,
}: Props) {
  const t = useTranslations('Volunteer');
  const { mutate, isPending } = useRemoveMembership();

  const handleRemove = () => {
    mutate(membershipId, {
      onSuccess: () => {
        toast.success(t('action.removedToast', { name: volunteerName }));
        onRemoved?.();
      },
      onError: () => toast.error(t('action.removeFailedToast')),
    });
  };

  const trigger =
    appearance === 'labeled' ? (
      <Button variant="outline" size="sm" disabled={isPending}>
        <Trash2 />
        {t('action.remove')}
      </Button>
    ) : (
      <Button
        size="icon-xs"
        variant="outline"
        tooltip={t('action.removeAria')}
        disabled={isPending}
      >
        <Trash2 />
      </Button>
    );

  return (
    <RequirePermission permission={PermissionKey.VolunteerEdit}>
      <DeleteAlertDialog
        title={t('action.removeTitle')}
        description={t('action.removeDescription', { name: volunteerName })}
        onDelete={handleRemove}
        deleteLabel={t('action.remove')}
        trigger={trigger}
      />
    </RequirePermission>
  );
}
