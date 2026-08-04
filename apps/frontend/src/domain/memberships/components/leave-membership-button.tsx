'use client';

import { useLeaveMembership } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { useRouter } from '@/i18n/navigation';

type Props = { membershipId: string; orgName: string };

export function LeaveMembershipButton({ membershipId, orgName }: Props) {
  const router = useRouter();
  const t = useTranslations('MembershipRequest');
  const { mutate, isPending } = useLeaveMembership();

  const handleLeave = () => {
    mutate(membershipId, {
      onSuccess: () => {
        toast.success(t('toast.left', { orgName }));
        router.refresh();
      },
      onError: () => toast.error(t('toast.leaveFailed')),
    });
  };

  return (
    <DeleteAlertDialog
      title={t('dialog.leaveTitle')}
      description={t('dialog.leaveDescription', { orgName })}
      onDelete={handleLeave}
      trigger={
        <Button variant="destructive" size="sm" disabled={isPending}>
          {t('actions.leave')}
        </Button>
      }
    />
  );
}
