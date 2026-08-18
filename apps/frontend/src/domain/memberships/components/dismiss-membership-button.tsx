'use client';

import { useRemoveMembershipRequest } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

type Props = { id: string };

export function DismissMembershipButton({ id }: Props) {
  const router = useRouter();
  const t = useTranslations('MembershipRequest');
  const { mutate, isPending } = useRemoveMembershipRequest();

  const handleDismiss = () => {
    mutate(id, {
      onSuccess: () => {
        toast.success(t('toast.dismissed'));
        router.refresh();
      },
      onError: () => toast.error(t('toast.dismissFailed')),
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDismiss}
      disabled={isPending}
    >
      {t('actions.dismiss')}
    </Button>
  );
}
