'use client';

import { useCancelMembershipRequest } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { useRouter } from '@/i18n/navigation';

type Props = { id: string; organizationUnitId: string; orgName: string };

export function WithdrawMembershipButton({
  id,
  organizationUnitId,
  orgName,
}: Props) {
  const router = useRouter();
  const t = useTranslations('MembershipRequest');
  const { mutate, isPending } = useCancelMembershipRequest();

  const handleWithdraw = () => {
    mutate(
      { id, organizationUnitId },
      {
        onSuccess: () => {
          toast.success(t('toast.withdrawn'));
          router.refresh();
        },
        onError: () => toast.error(t('toast.withdrawFailed')),
      },
    );
  };

  return (
    <DeleteAlertDialog
      title={t('dialog.withdrawTitle')}
      description={t('dialog.withdrawDescription', { orgName })}
      onDelete={handleWithdraw}
      trigger={
        <Button variant="outline" size="sm" disabled={isPending}>
          {t('actions.withdraw')}
        </Button>
      }
    />
  );
}
