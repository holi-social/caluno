'use client';

import {
  fromGraphQLError,
  JoinStatus,
  RequiredFormTargetType,
  ShiftInviteOrigin,
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
import { useRequiredFormsGate } from '@/domain/requirement-form/use-required-forms-gate';
import {
  isOutstandingInvite,
  isParticipatingInvite,
} from '@/domain/shift/invite-status-display';
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
  inviteOrigin?: ShiftInviteOrigin | null;
  inviteStatus?: ShiftInviteStatus | null;
  onInviteChange?: (invite: {
    origin: ShiftInviteOrigin | null;
    status: ShiftInviteStatus | null;
  }) => void;
  /** Instance start, used for the cancel-confirm dialog copy. */
  startsAt?: string;
  label?: string;
  className?: string;
  /** True when the user already clicked join for this instance and the backend returned a pending membership request. */
  isPendingIntended?: boolean;
  shiftRequiredForms?: RequiredForm[];
  instanceRequiredForms?: RequiredForm[];
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
  inviteOrigin,
  inviteStatus,
  onInviteChange,
  startsAt,
  label,
  className,
  isPendingIntended = false,
  shiftRequiredForms = [],
  instanceRequiredForms = [],
  organizationUnitRequiredForms = [],
}: JoinShiftButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
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
        onInviteChange?.({
          origin: inviteOrigin ?? ShiftInviteOrigin.AdminInvited,
          status: nextInviteStatus,
        });
        router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error) ?? t('join.failed'));
      }
    },
    [instanceId, inviteOrigin, respondToInvite, router, t, onInviteChange],
  );

  const handleCancel = useCallback(async () => {
    if (!instanceId) {
      toast.error('This shift link is missing an instance.');
      return;
    }
    try {
      await respondToInvite.mutateAsync({
        instanceId,
        status: ShiftInviteStatus.VolunteerCancelled,
      });
      toast.success(t('join.cancelled'));
      onInviteChange?.({
        origin: inviteOrigin ?? null,
        status: ShiftInviteStatus.VolunteerCancelled,
      });
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error) ?? t('join.failed'));
    }
  }, [instanceId, inviteOrigin, respondToInvite, router, t, onInviteChange]);

  const targetRequiredForms = [...shiftRequiredForms, ...instanceRequiredForms];

  const { needsCombinedForms, goToCombinedForms } = useRequiredFormsGate(
    membershipState,
    targetRequiredForms,
    organizationUnitRequiredForms,
    instanceId ? `/shifts/${shiftId}/instances/${instanceId}/join-forms` : null,
  );

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
          orgUId: organizationUnitId,
          redirectTo: baseRedirectTo,
        });
        // Full navigation so `/api/invite` can Set-Cookie `pending_invite`.
        window.location.href = `/api/invite?${searchParams}`;
        return;
      }

      if (!instanceId) {
        toast.error('This shift link is missing an instance.');
        return;
      }

      if (needsCombinedForms) {
        goToCombinedForms();
        return;
      }

      try {
        const result = await joinShiftInstance.mutateAsync(instanceId);

        if (result.status === JoinStatus.Joined) {
          toast.success(t('join.joined'));
          onInviteChange?.({
            origin: ShiftInviteOrigin.VolunteerJoined,
            status: null,
          });
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
      onInviteChange,
      onMembershipStateChange,
      needsCombinedForms,
      goToCombinedForms,
    ],
  );

  const handleReenter = useCallback(async () => {
    if (visibility === ShiftVisibility.AllMembers) {
      await handleJoin();
    } else {
      await handleRespond(
        ShiftInviteStatus.VolunteerAccepted,
        t('join.accepted'),
      );
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

  const invite = { origin: inviteOrigin, status: inviteStatus };

  if (isOutstandingInvite(invite)) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Button
          onClick={() =>
            handleRespond(
              ShiftInviteStatus.VolunteerAccepted,
              t('join.accepted'),
            )
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
    inviteStatus === ShiftInviteStatus.VolunteerCancelled ||
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

  if (isParticipatingInvite(invite)) {
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

  if (
    inviteStatus === ShiftInviteStatus.AdminRejected ||
    inviteStatus === ShiftInviteStatus.AdminCancelled
  ) {
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
