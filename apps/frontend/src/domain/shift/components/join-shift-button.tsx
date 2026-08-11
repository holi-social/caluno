'use client';

import {
  fromGraphQLError,
  JoinStatus,
  RequiredFormTargetType,
  ShiftInviteStatus,
  ShiftVisibility,
} from '@repo/data';
import type { RequiredForm } from '@repo/data/react';
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
import { BanIcon, ClockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';

function getErrorMessage(error: unknown): string {
  return fromGraphQLError(error).message;
}

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
  /** True when the user already clicked join for this instance and the backend returned a pending membership request. */
  isPendingIntended?: boolean;
  /** Required forms configured on the shift itself. */
  shiftRequiredForms?: RequiredForm[];
  /** Required forms configured on the selected shift instance. */
  instanceRequiredForms?: RequiredForm[];
  /** Required forms configured on the shift's organization unit. */
  organizationUnitRequiredForms?: RequiredForm[];
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
  isPendingIntended = false,
  shiftRequiredForms = [],
  instanceRequiredForms = [],
  organizationUnitRequiredForms = [],
}: JoinShiftButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const joinShiftInstance = useJoinShiftInstance();
  const respondToInvite = useUpdateShiftInstanceInviteStatus();
  const t = useTranslations('Shift');
  const { formatDate } = useFormatting();

  const [_hasAutoJoined, _setHasAutoJoined] = useState(false);
  const autoJoinExecuted = useRef(false);

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
        router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error) ?? t('join.failed'));
      }
    },
    [instanceId, respondToInvite, router, t, onInviteStatusChange],
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
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error) ?? t('join.failed'));
    }
  }, [instanceId, respondToInvite, router, t, onInviteStatusChange]);

  const targetRequiredForms = [...shiftRequiredForms, ...instanceRequiredForms];

  const needsCombinedForms =
    membershipState === JoinStatus.None &&
    targetRequiredForms.length > 0 &&
    organizationUnitRequiredForms.length > 0;

  const redirectToCombinedForms = useCallback(() => {
    if (!instanceId) {
      toast.error('This shift link is missing an instance.');
      return;
    }
    router.push(
      `/shifts/${shiftId}/instances/${instanceId}/join-forms?redirectTo=/`,
    );
  }, [instanceId, router, shiftId]);

  const handleJoin = useCallback(
    async (isAuto = false) => {
      if (!isAuthenticated) {
        const baseRedirectTo = `/shifts/${shiftId}?${new URLSearchParams({
          ...(needsCombinedForms
            ? { showJoinForms: 'true' }
            : { autoJoin: 'true' }),
          ...(instanceId ? { instanceId } : {}),
        })}`;
        const searchParams = new URLSearchParams({
          signup: '1',
          redirectTo: baseRedirectTo,
        });
        router.push(`/api/invite?${searchParams}`);
        return;
      }

      if (!instanceId) {
        toast.error('This shift link is missing an instance.');
        return;
      }

      if (needsCombinedForms) {
        redirectToCombinedForms();
        return;
      }

      try {
        const result = await joinShiftInstance.mutateAsync(instanceId);

        if (result.status === JoinStatus.Joined) {
          toast.success(t('join.joined'));
          onInviteStatusChange?.(ShiftInviteStatus.SelfJoined);
          if (isAuto) router.push('/');
        } else if (result.status === JoinStatus.Pending) {
          toast.success(t('join.pending'));
          onMembershipStateChange?.(JoinStatus.Pending);
          if (isAuto) router.push('/');
        } else if (result.status === JoinStatus.Rejected) {
          toast.error(t('join.rejected'));
          onMembershipStateChange?.(JoinStatus.Rejected);
        } else if (result.status === JoinStatus.RequirementsNeeded) {
          const missingForms = (result.requiredForms ?? []).filter(
            (f) => !f.submitted,
          );
          if (missingForms.length > 0) {
            const redirectTo = encodeURIComponent(
              isAuto ? '/' : `${pathname}${window.location.search}`,
            );
            if (
              missingForms[0]?.targetType === RequiredFormTargetType.Shift ||
              missingForms[0]?.targetType ===
                RequiredFormTargetType.ShiftInstance
            ) {
              router.push(
                `/shifts/${shiftId}/instances/${instanceId}/forms?redirectTo=${redirectTo}`,
              );
            } else {
              router.push(
                `/join/${organizationUnitId}/forms?redirectTo=${redirectTo}`,
              );
            }
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

        router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error) ?? t('join.failed'));
      }
    },
    [
      isAuthenticated,
      shiftId,
      instanceId,
      joinShiftInstance,
      router,
      pathname,
      t,
      organizationUnitId,
      onInviteStatusChange,
      onMembershipStateChange,
      needsCombinedForms,
      redirectToCombinedForms,
    ],
  );

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
      !autoJoinExecuted.current &&
      visibility === ShiftVisibility.AllMembers
    ) {
      autoJoinExecuted.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete('autoJoin');
      window.history.replaceState({}, '', url.toString());

      handleJoin(true);
    }
  }, [autoJoin, isAuthenticated, instanceId, visibility, handleJoin]);

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
  if (membershipState === JoinStatus.Rejected) {
    return (
      <Button disabled variant="outline" size="xl" className={className}>
        {t('join.rejectedCta')}
      </Button>
    );
  }

  if (isPendingIntended) {
    return (
      <Button disabled variant="secondary" size="xl" className={className}>
        <ClockIcon className="size-5" />
        {t('join.pendingCta')}
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
      onClick={() => handleJoin()}
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
