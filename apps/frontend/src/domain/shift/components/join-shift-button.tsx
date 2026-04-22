'use client';

import { JoinShiftStatus, ShiftVisibility } from '@repo/data';
import { useJoinShift } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface JoinShiftButtonProps {
  shiftId: string;
  visibility: ShiftVisibility;
  isAuthenticated: boolean;
  autoJoin?: boolean;
}

export function JoinShiftButton({
  shiftId,
  visibility,
  isAuthenticated,
  autoJoin = false,
}: JoinShiftButtonProps) {
  const router = useRouter();
  const joinShift = useJoinShift();

  const [requestSent, setRequestSent] = useState(false);
  const [hasAutoJoined, setHasAutoJoined] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!isAuthenticated) {
      const searchParams = new URLSearchParams({
        redirectTo: `/shifts/${shiftId}?autoJoin=true`,
      });
      router.push(`/api/invite?${searchParams}`);
      return;
    }

    try {
      const result = await joinShift.mutateAsync(shiftId);

      if (result.status === JoinShiftStatus.Joined) {
        toast.success('You have joined the shift');
        router.refresh();
      } else if (result.status === JoinShiftStatus.MembershipRequested) {
        toast.success('Membership request sent successfully');
        setRequestSent(true);
        router.refresh();
      } else if (result.status === JoinShiftStatus.RequirementsNeeded) {
        const missing = result.requirementStatuses?.filter(
          (s) => s.status !== 'APPROVED',
        );
        const approved = result.requirementStatuses?.filter(
          (s) => s.status === 'APPROVED',
        );

        if (missing && missing.length > 0) {
          const missingNames = missing.map((s) => s.name).join(', ');
          toast.info(
            `Requirements needed: ${missingNames}${
              approved && approved.length > 0
                ? ` (already completed: ${approved.map((s) => s.name).join(', ')})`
                : ''
            }`,
          );
        } else {
          toast.info('Requirement profile ui (to be implemented)');
        }
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to join shift',
      );
    }
  }, [isAuthenticated, shiftId, joinShift, router]);

  useEffect(() => {
    if (
      autoJoin &&
      isAuthenticated &&
      !hasAutoJoined &&
      visibility === ShiftVisibility.AllMembers
    ) {
      setHasAutoJoined(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('autoJoin');
      window.history.replaceState({}, '', url.toString());

      handleJoin();
    }
  }, [autoJoin, isAuthenticated, hasAutoJoined, visibility, handleJoin]);

  if (visibility !== ShiftVisibility.AllMembers) {
    return (
      <Button disabled variant="outline">
        Invite only
      </Button>
    );
  }

  if (requestSent) {
    return <Button disabled>Membership request sent</Button>;
  }

  return (
    <Button onClick={handleJoin} disabled={joinShift.isPending}>
      {joinShift.isPending ? 'Joining...' : 'Join shift'}
    </Button>
  );
}
