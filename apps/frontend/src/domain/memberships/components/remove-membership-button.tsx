'use client';

import { PermissionKey, useRemoveMembership } from '@repo/data/react';
import { Button } from '@repo/ui';
import { UserMinus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { RequirePermission } from '@/components/require-permission';

type Props = { membershipId: string; volunteerName: string };

export function RemoveMembershipButton({ membershipId, volunteerName }: Props) {
  const t = useTranslations('Volunteer');
  const { mutate, isPending } = useRemoveMembership();

  const handleRemove = () => {
    mutate(membershipId, {
      onSuccess: () => {
        toast.success(t('action.removedToast', { name: volunteerName }));
      },
      onError: () => toast.error(t('action.removeFailedToast')),
    });
  };

  return (
    <RequirePermission permission={PermissionKey.VolunteerEdit}>
      <DeleteAlertDialog
        title={t('action.removeTitle')}
        description={t('action.removeDescription', { name: volunteerName })}
        onDelete={handleRemove}
        deleteLabel={t('action.remove')}
        trigger={
          <Button
            size="icon-xs"
            variant="destructive"
            tooltip={t('action.removeAria')}
            disabled={isPending}
          >
            <UserMinus />
          </Button>
        }
      />
    </RequirePermission>
  );
}
