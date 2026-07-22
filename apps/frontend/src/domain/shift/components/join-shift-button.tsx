'use client';

import { JoinStatus, ShiftVisibility } from '@repo/data';
import { useJoinShiftInstance } from '@repo/data/react';
import { Button } from '@repo/ui';
import { CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

interface JoinShiftButtonProps {
  shiftId: string;
  instanceId?: string;
  organizationUnitId: string;
  visibility: ShiftVisibility;
  isAuthenticated: boolean;
  autoJoin?: boolean;
  isFull?: boolean;
  status?: JoinStatus;
  onStatusChange?: (status: JoinStatus) => void;
  label?: string;
  className?: string;
}

export function JoinShiftButton({
  shiftId,
  instanceId,
  organizationUnitId,
  visibility,
  isAuthenticated,
  autoJoin = false,
  isFull = false,
  status = JoinStatus.None,
  onStatusChange,
  label,
  className,
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
        onStatusChange?.(JoinStatus.Joined);
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('join.pending'));
        onStatusChange?.(JoinStatus.Pending);
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(t('join.rejected'));
        onStatusChange?.(JoinStatus.Rejected);
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        const missingForms = (result.requiredForms ?? []).filter(
          (f) => !f.submitted,
        );
        if (missingForms.length > 0) {
          const currentUrl = window.location.href;
          router.push(
            `/join/${organizationUnitId}/forms?redirectTo=${encodeURIComponent(currentUrl)}`,
          );
          return;
        }

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
  }, [
    isAuthenticated,
    shiftId,
    instanceId,
    joinShiftInstance,
    router,
    t,
    organizationUnitId,
    onStatusChange,
  ]);

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

  if (status === JoinStatus.Joined) {
    return (
      <Button disabled variant="secondary" size="xl" className={className}>
        <CheckIcon className="size-5" />
        {t('join.joinedCta')}
      </Button>
    );
  }

  if (status === JoinStatus.Pending) {
    return (
      <Button disabled variant="secondary" size="xl" className={className}>
        {t('join.pendingCta')}
      </Button>
    );
  }

  if (status === JoinStatus.Rejected) {
    return (
      <Button disabled variant="outline" size="xl" className={className}>
        {t('join.rejectedCta')}
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button disabled variant="outline" size="xl" className={className}>
        {t('join.full')}
      </Button>
    );
  }

  if (visibility !== ShiftVisibility.AllMembers) {
    return (
      <Button disabled variant="outline" size="xl" className={className}>
        {t('join.inviteOnly')}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={joinShiftInstance.isPending || !instanceId}
      size="xl"
      className={className}
    >
      {joinShiftInstance.isPending
        ? t('join.joining')
        : (label ?? t('join.joinShift'))}
    </Button>
  );
}
