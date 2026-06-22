'use client';

import { JoinStatus, ShiftVisibility } from '@repo/data';
import { useJoinShiftInstance } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

interface JoinShiftButtonProps {
  shiftId: string;
  instanceId?: string;
  visibility: ShiftVisibility;
  isAuthenticated: boolean;
  autoJoin?: boolean;
}

export function JoinShiftButton({
  shiftId,
  instanceId,
  visibility,
  isAuthenticated,
  autoJoin = false,
}: JoinShiftButtonProps) {
  const router = useRouter();
  const joinShiftInstance = useJoinShiftInstance();

  const [hasAutoJoined, setHasAutoJoined] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!isAuthenticated) {
      const searchParams = new URLSearchParams({
        redirectTo: `/shifts/${shiftId}?${new URLSearchParams({
          autoJoin: 'true',
          ...(instanceId ? { instanceId } : {}),
        })}`,
      });
      router.push(`/api/invite?${searchParams}`);
      return;
    }

    if (!instanceId) {
      toast.error('This shift link is missing an instance.');
      return;
    }

    try {
      const result = await joinShiftInstance.mutateAsync(instanceId);

      if (result.status === JoinStatus.Joined) {
        toast.success('You have joined the shift');
        router.refresh();
      } else if (result.status === JoinStatus.Pending) {
        toast.success(
          'Your membership request is pending. You will be added to this shift once approved.',
        );
        router.refresh();
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(
          'Your membership request for this organization was rejected. Contact an admin if you believe this was a mistake.',
        );
      } else if (result.status === JoinStatus.RequirementsNeeded) {
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
  }, [isAuthenticated, shiftId, instanceId, joinShiftInstance, router]);

  useEffect(() => {
    if (
      autoJoin &&
      isAuthenticated &&
      instanceId &&
      !hasAutoJoined &&
      visibility === ShiftVisibility.AllMembers
    ) {
      setHasAutoJoined(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('autoJoin');
      window.history.replaceState({}, '', url.toString());

      handleJoin();
    }
  }, [
    autoJoin,
    isAuthenticated,
    instanceId,
    hasAutoJoined,
    visibility,
    handleJoin,
  ]);

  if (visibility !== ShiftVisibility.AllMembers) {
    return (
      <Button disabled variant="outline">
        Invite only
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={joinShiftInstance.isPending || !instanceId}
    >
      {joinShiftInstance.isPending ? 'Joining...' : 'Join shift'}
    </Button>
  );
}
