'use client';

import { JoinStatus, ShiftInviteStatus, ShiftVisibility } from '@repo/data';
import {
  useJoinShiftInstance,
  useUpdateShiftInstanceInviteStatus,
} from '@repo/data/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  cn,
} from '@repo/ui';
import { BanIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';

interface JoinShiftButtonProps {
  shiftId: string;
  instanceId?: string;
  organizationUnitId: string;
  visibility: ShiftVisibility;
  isAuthenticated: boolean;
  autoJoin?: boolean;
  isFull?: boolean;
  /** Org-membership state — drives the pending/rejected CTA for non-invited users. */
  membershipState?: JoinStatus;
  onMembershipStateChange?: (status: JoinStatus) => void;
  inviteStatus?: ShiftInviteStatus | null;
  onInviteStatusChange?: (status: ShiftInviteStatus) => void;
  /** Instance start, used for the cancel-confirm dialog copy. */
  startsAt?: string;
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
  membershipState = JoinStatus.None,
  onMembershipStateChange,
  inviteStatus,
  onInviteStatusChange,
  startsAt,
  label,
  className,
}: JoinShiftButtonProps) {
  const router = useRouter();
  const joinShiftInstance = useJoinShiftInstance();
  const respondToInvite = useUpdateShiftInstanceInviteStatus();
  const t = useTranslations('Shift');
  const { formatDate } = useFormatting();

  const [hasAutoJoined, setHasAutoJoined] = useState(false);

  const handleRespond = useCallback(
    async (nextInviteStatus: ShiftInviteStatus, successMessage: string) => {
      if (!instanceId) {
        toast.error('This shift link is missing an instance.');
        return;
      }
      try {
        await respondToInvite.mutateAsync({
          instanceId,
          status: nextInviteStatus,
        });
        toast.success(successMessage);
        onInviteStatusChange?.(nextInviteStatus);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('join.failed'));
      }
    },
    [instanceId, respondToInvite, t, onInviteStatusChange],
  );

  const handleCancel = useCallback(async () => {
    if (!instanceId) {
      toast.error('This shift link is missing an instance.');
      return;
    }
    try {
      await respondToInvite.mutateAsync({
        instanceId,
        status: ShiftInviteStatus.Cancelled,
      });
      toast.success(t('join.cancelled'));
      onInviteStatusChange?.(ShiftInviteStatus.Cancelled);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('join.failed'));
    }
  }, [instanceId, respondToInvite, t, onInviteStatusChange]);

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
        onInviteStatusChange?.(ShiftInviteStatus.SelfJoined);
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('join.pending'));
        onMembershipStateChange?.(JoinStatus.Pending);
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(t('join.rejected'));
        onMembershipStateChange?.(JoinStatus.Rejected);
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
    onInviteStatusChange,
    onMembershipStateChange,
  ]);

  const handleReenter = useCallback(async () => {
    if (visibility === ShiftVisibility.AllMembers) {
      await handleJoin();
    } else {
      await handleRespond(ShiftInviteStatus.Accepted, t('join.accepted'));
    }
  }, [visibility, handleJoin, handleRespond, t]);

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

  if (inviteStatus === ShiftInviteStatus.Invited) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button
          onClick={() =>
            handleRespond(ShiftInviteStatus.Accepted, t('join.accepted'))
          }
          disabled={respondToInvite.isPending || !instanceId}
          size="xl"
        >
          {t('join.accept')}
        </Button>
        <Button
          onClick={() =>
            handleRespond(
              ShiftInviteStatus.VolunteerRejected,
              t('join.declined'),
            )
          }
          disabled={respondToInvite.isPending || !instanceId}
          variant="outline"
          size="xl"
        >
          {t('join.decline')}
        </Button>
      </div>
    );
  }

  if (
    inviteStatus === ShiftInviteStatus.Cancelled ||
    inviteStatus === ShiftInviteStatus.VolunteerRejected
  ) {
    return (
      <Button
        onClick={handleReenter}
        disabled={
          joinShiftInstance.isPending ||
          respondToInvite.isPending ||
          !instanceId
        }
        size="xl"
        className={className}
      >
        {t('join.reenter')}
      </Button>
    );
  }

  if (
    inviteStatus === ShiftInviteStatus.Accepted ||
    inviteStatus === ShiftInviteStatus.SelfJoined
  ) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="xl" className={className}>
            <BanIcon className="size-5" />
            {t('join.cancelShift')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('join.cancelTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('join.cancelBody', {
                date: startsAt
                  ? formatDate(new Date(startsAt), {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                    })
                  : '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleCancel}
              variant="outline"
              disabled={respondToInvite.isPending}
            >
              <BanIcon className="size-4" />
              {t('join.confirmCancel')}
            </AlertDialogAction>
            <AlertDialogCancel variant="default">
              {t('join.keepShift')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (inviteStatus === ShiftInviteStatus.AdminRejected) {
    return (
      <Button disabled variant="outline" size="xl" className={className}>
        {t('join.rejectedCta')}
      </Button>
    );
  }

  // No instance invite: fall back to the org-membership state.
  if (membershipState === JoinStatus.Pending) {
    return (
      <Button disabled variant="secondary" size="xl" className={className}>
        {t('join.pendingCta')}
      </Button>
    );
  }

  if (membershipState === JoinStatus.Rejected) {
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
