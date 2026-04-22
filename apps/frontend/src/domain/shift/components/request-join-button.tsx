'use client';

import { useJoinOrganization } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface RequestJoinButtonProps {
  organizationUnitId: string;
}

export function RequestJoinButton({
  organizationUnitId,
}: RequestJoinButtonProps) {
  const router = useRouter();
  const [isSent, setIsSent] = useState(false);
  const joinOrg = useJoinOrganization();

  const handleClick = async () => {
    try {
      const result = await joinOrg.mutateAsync(organizationUnitId);

      if (result.status === 'JOINED') {
        toast.success('You have joined the organization');
      } else if (result.status === 'PENDING') {
        toast.success('Membership request sent successfully');
        setIsSent(true);
      } else if (result.status === 'REJECTED') {
        toast.error(
          'Your membership request for this organization was rejected. Contact an admin if you believe this was a mistake.',
        );
      } else if (result.status === 'REQUIREMENTS_NEEDED') {
        toast.info('Requirements needed to join this organization');
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to join organization',
      );
    }
  };

  if (isSent) {
    return <Button disabled>Request sent</Button>;
  }

  return (
    <Button onClick={handleClick} disabled={joinOrg.isPending}>
      {joinOrg.isPending ? 'Sending request...' : 'Request to join'}
    </Button>
  );
}
