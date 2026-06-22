'use client';

import { useCancelMembershipRequest } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

interface CancelMembershipRequestButtonProps {
  id: string;
  organizationUnitId: string;
}

export function CancelMembershipRequestButton({
  id,
  organizationUnitId,
}: CancelMembershipRequestButtonProps) {
  const router = useRouter();
  const { mutate, isPending } = useCancelMembershipRequest();
  const t = useTranslations('MembershipRequest');

  function handleCancel() {
    mutate(
      { id, organizationUnitId },
      {
        onSuccess: () => {
          toast.success(t('toast.cancelled'));
          router.refresh();
        },
        onError: () => {
          toast.error(t('toast.cancelFailed'));
        },
      },
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleCancel}
      disabled={isPending}
    >
      {isPending ? t('cancelButtonSubmitting') : t('cancelButton')}
    </Button>
  );
}
