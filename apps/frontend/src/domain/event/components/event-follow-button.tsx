'use client';

import { EventInviteStatus, JoinStatus } from '@repo/data';
import type { RequiredForm } from '@repo/data/react';
import { useJoinEvent, useUpdateEventInviteStatus } from '@repo/data/react';
import { Button } from '@repo/ui';
import { BanIcon, BellRingIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRequiredFormsGate } from '@/domain/requirement-form/use-required-forms-gate';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth';

interface EventFollowButtonProps {
  eventId: string;
  organizationUnitId?: string | null;
  startsAt: string;
  initialStatus: JoinStatus;
  initialInviteStatus?: EventInviteStatus | null;
  /** Org-membership state — drives the required-forms gate, distinct from the per-event follow status. */
  membershipState?: JoinStatus;
  eventRequiredForms?: RequiredForm[];
  organizationUnitRequiredForms?: RequiredForm[];
}

function isBeforeOrAtEventStart(startsAt: string): boolean {
  return Date.now() <= new Date(startsAt).getTime();
}

export function EventFollowButton({
  eventId,
  organizationUnitId,
  startsAt,
  initialStatus,
  initialInviteStatus = null,
  membershipState = JoinStatus.None,
  eventRequiredForms = [],
  organizationUnitRequiredForms = [],
}: EventFollowButtonProps) {
  const t = useTranslations('EventDetail');
  const joinEvent = useJoinEvent();
  const updateInviteStatus = useUpdateEventInviteStatus();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoFollow = searchParams.get('autoFollow') === 'true';
  const autoFollowExecuted = useRef(false);
  const [joinStatus, setJoinStatus] = useState(initialStatus);
  const [inviteStatus, setInviteStatus] = useState(initialInviteStatus);
  const session = useSession();
  const canWithdrawOrCancel = isBeforeOrAtEventStart(startsAt);

  useEffect(() => {
    setJoinStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setInviteStatus(initialInviteStatus);
  }, [initialInviteStatus]);

  const isFinalFollowStatus =
    joinStatus === JoinStatus.Joined ||
    joinStatus === JoinStatus.Pending ||
    joinStatus === JoinStatus.Rejected;

  const { needsCombinedForms, goToCombinedForms } = useRequiredFormsGate(
    membershipState,
    eventRequiredForms,
    organizationUnitRequiredForms,
    `/events/${eventId}/join-forms`,
  );

  const handleFollow = useCallback(
    async (isAuto = false) => {
      if (!session.data?.user) {
        const baseRedirectTo = `/events/${eventId}?${new URLSearchParams({
          ...(needsCombinedForms
            ? { showJoinForms: 'true' }
            : { autoFollow: 'true' }),
        })}`;
        const inviteParams = new URLSearchParams({
          redirectTo: baseRedirectTo,
        });
        if (organizationUnitId) {
          inviteParams.set('orgUId', organizationUnitId);
        }
        window.location.href = `/api/invite?${inviteParams}`;
        return;
      }

      if (needsCombinedForms) {
        goToCombinedForms();
        return;
      }

      try {
        const result = await joinEvent.mutateAsync(eventId);

        if (result.status === JoinStatus.Joined) {
          setJoinStatus(JoinStatus.Joined);
          setInviteStatus(EventInviteStatus.Joined);
          if (isAuto) router.push('/');
        } else if (result.status === JoinStatus.Pending) {
          setJoinStatus(JoinStatus.Pending);
          setInviteStatus(EventInviteStatus.AwaitingAdminApproval);
          toast.success(t('requestSentToast'));
          if (isAuto) router.push('/');
        } else if (result.status === JoinStatus.Rejected) {
          setJoinStatus(JoinStatus.Rejected);
          toast.error(t('rejectedToast'));
        } else if (result.status === JoinStatus.RequirementsNeeded) {
          const missingForms = result.requiredForms?.filter(
            (f) => !f.submitted,
          );
          if (missingForms && missingForms.length > 0) {
            const redirectTo = encodeURIComponent(
              isAuto ? '/' : `${pathname}${window.location.search}`,
            );
            router.push(`/events/${eventId}/forms?redirectTo=${redirectTo}`);
          }
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : undefined);
      }
    },
    [
      eventId,
      organizationUnitId,
      joinEvent,
      router,
      session.data?.user,
      pathname,
      goToCombinedForms,
      t,
      needsCombinedForms,
    ],
  );

  const handleCancelParticipation = useCallback(async () => {
    try {
      const updated = await updateInviteStatus.mutateAsync({
        eventId,
        status: EventInviteStatus.VolunteerCancelled,
      });
      setInviteStatus(updated.status);
      setJoinStatus(JoinStatus.VolunteerRejected);
      toast.success(t('canceledToast'));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : undefined);
    }
  }, [eventId, updateInviteStatus, router, t]);

  const handleWithdrawRequest = useCallback(async () => {
    try {
      const updated = await updateInviteStatus.mutateAsync({
        eventId,
        status: EventInviteStatus.VolunteerRejected,
      });
      setInviteStatus(updated.status);
      setJoinStatus(JoinStatus.VolunteerRejected);
      toast.success(t('withdrawnToast'));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : undefined);
    }
  }, [eventId, updateInviteStatus, router, t]);

  useEffect(() => {
    if (
      autoFollow &&
      session.data?.user &&
      !isFinalFollowStatus &&
      inviteStatus !== EventInviteStatus.VolunteerCancelled &&
      inviteStatus !== EventInviteStatus.VolunteerRejected &&
      !autoFollowExecuted.current
    ) {
      autoFollowExecuted.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete('autoFollow');
      window.history.replaceState({}, '', url.toString());
      handleFollow(true);
    }
  }, [
    autoFollow,
    handleFollow,
    isFinalFollowStatus,
    inviteStatus,
    session.data?.user,
  ]);

  const isPending =
    inviteStatus === EventInviteStatus.AwaitingAdminApproval ||
    joinStatus === JoinStatus.Pending;

  const isJoined =
    inviteStatus === EventInviteStatus.Joined ||
    (joinStatus === JoinStatus.Joined &&
      inviteStatus !== EventInviteStatus.VolunteerCancelled);

  if (inviteStatus === EventInviteStatus.VolunteerCancelled) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {t('canceledNote')}
        </p>
        <Button
          size="lg"
          variant="outline"
          onClick={() => handleFollow()}
          disabled={joinEvent.isPending}
          className="h-11 w-full font-semibold"
        >
          <BellRingIcon className="size-[18px]" />
          {t('followCta')}
        </Button>
      </div>
    );
  }

  if (
    inviteStatus === EventInviteStatus.VolunteerRejected &&
    joinStatus !== JoinStatus.Rejected
  ) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {t('withdrawnNote')}
        </p>
        <Button
          size="lg"
          variant="outline"
          onClick={() => handleFollow()}
          disabled={joinEvent.isPending}
          className="h-11 w-full font-semibold"
        >
          <BellRingIcon className="size-[18px]" />
          {t('followCta')}
        </Button>
      </div>
    );
  }

  if (isJoined) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          variant="secondary"
          disabled
          className="h-11 w-full font-semibold"
          aria-pressed
        >
          <BellRingIcon className="size-[18px]" />
          {t('followingCta')}
        </Button>
        {canWithdrawOrCancel ? (
          <Button
            size="lg"
            variant="outline"
            onClick={handleCancelParticipation}
            disabled={updateInviteStatus.isPending}
            className="h-11 w-full font-semibold"
          >
            <BanIcon className="size-[18px]" />
            {t('cancelParticipation')}
          </Button>
        ) : null}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          variant="secondary"
          disabled
          className="h-11 w-full font-semibold"
        >
          <BellRingIcon className="size-[18px]" />
          {t('pendingCta')}
        </Button>
        <p className="text-sm text-muted-foreground">{t('pendingNote')}</p>
        {canWithdrawOrCancel ? (
          <Button
            size="lg"
            variant="outline"
            onClick={handleWithdrawRequest}
            disabled={updateInviteStatus.isPending}
            className="h-11 w-full font-semibold"
          >
            <BanIcon className="size-[18px]" />
            {t('withdrawRequest')}
          </Button>
        ) : null}
      </div>
    );
  }

  if (joinStatus === JoinStatus.Rejected) {
    return (
      <Button
        size="lg"
        variant="secondary"
        disabled
        className="h-11 w-full font-semibold"
      >
        <BellRingIcon className="size-[18px]" />
        {t('rejectedCta')}
      </Button>
    );
  }

  return (
    <div>
      <Button
        size="lg"
        variant="outline"
        onClick={() => handleFollow()}
        disabled={joinEvent.isPending}
        className="h-11 w-full font-semibold"
        aria-pressed={false}
      >
        <BellRingIcon className="size-[18px]" />
        {t('followCta')}
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">{t('followNote')}</p>
    </div>
  );
}
