'use client';

import { Button } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createMembershipRequest } from '@/domain/membership-requests/actions';

interface RequestJoinButtonProps {
  organizationUnitId: string;
}

export function RequestJoinButton({
  organizationUnitId,
}: RequestJoinButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSent, setIsSent] = useState(false);

  const handleClick = () => {
    startTransition(async () => {
      const result = await createMembershipRequest({ organizationUnitId });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success('Membership request sent successfully');
      setIsSent(true);
      router.refresh();
    });
  };

  if (isSent) {
    return <Button disabled>Request sent</Button>;
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Sending request...' : 'Request to join'}
    </Button>
  );
}
