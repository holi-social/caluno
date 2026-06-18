'use client';

import { useCancelMembershipRequest } from '@repo/data/react';
import { Button } from '@repo/ui';
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

  function handleCancel() {
    mutate(
      { id, organizationUnitId },
      {
        onSuccess: () => {
          toast.success('Membership request cancelled');
          router.refresh();
        },
        onError: () => {
          toast.error('Failed to cancel membership request');
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
      {isPending ? 'Cancelling...' : 'Cancel Request'}
    </Button>
  );
}
