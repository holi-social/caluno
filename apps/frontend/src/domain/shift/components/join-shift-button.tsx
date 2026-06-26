'use client';

import { JoinStatus, ShiftVisibility } from '@repo/data';
import { useJoinShiftInstance } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Shift');

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
        toast.success(t('join.joined'));
        router.refresh();
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('join.pending'));
        router.refresh();
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(t('join.rejected'));
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        const missing = result.requirementStatuses?.filter(
          (s) => s.status !== 'APPROVED',
        );
        const approved = result.requirementStatuses?.filter(
          (s) => s.status === 'APPROVED',
        );

        if (missing && missing.length > 0) {
          const missingNames = missing.map((s) => s.name).join(', ');
          const approvedNames = approved?.map((s) => s.name).join(', ');
          toast.info(
            t('join.requirementsNeeded', {
              missing: missingNames,
              hasCompleted: approved && approved.length > 0 ? 'yes' : 'no',
              completed: approvedNames ?? '',
            }),
          );
        } else {
          toast.info(t('join.requirementsFallback'));
        }
      } else {
        toast.error(t('join.unexpected'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('join.failed'));
    }
  }, [isAuthenticated, shiftId, instanceId, joinShiftInstance, router, t]);

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
        {t('join.inviteOnly')}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={joinShiftInstance.isPending || !instanceId}
    >
      {joinShiftInstance.isPending ? t('join.joining') : t('join.joinShift')}
    </Button>
  );
}
