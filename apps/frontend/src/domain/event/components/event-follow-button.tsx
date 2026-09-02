'use client';

import { JoinStatus } from '@repo/data';
import type { RequiredForm } from '@repo/data/react';
import { useJoinEvent } from '@repo/data/react';
import { Button } from '@repo/ui';
import { BellRingIcon } from 'lucide-react';
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
  initialStatus: JoinStatus;
  /** Org-membership state — drives the required-forms gate, distinct from the per-event follow status. */
  membershipState?: JoinStatus;
  eventRequiredForms?: RequiredForm[];
  organizationUnitRequiredForms?: RequiredForm[];
}

export function EventFollowButton({
  eventId,
  organizationUnitId,
  initialStatus,
  membershipState = JoinStatus.None,
  eventRequiredForms = [],
  organizationUnitRequiredForms = [],
}: EventFollowButtonProps) {
  const t = useTranslations('EventDetail');
  const joinEvent = useJoinEvent();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoFollow = searchParams.get('autoFollow') === 'true';
  const autoFollowExecuted = useRef(false);
  const [status, setStatus] = useState(initialStatus);
  const session = useSession();

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const isFinalStatus =
    status === JoinStatus.Joined ||
    status === JoinStatus.Pending ||
    status === JoinStatus.Rejected;

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
        // Full navigation so `/api/invite` can Set-Cookie `pending_invite`.
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
          setStatus(JoinStatus.Joined);
          if (isAuto) router.push('/');
        } else if (result.status === JoinStatus.Pending) {
          setStatus(JoinStatus.Pending);
          toast.success(t('requestSentToast'));
          if (isAuto) router.push('/');
        } else if (result.status === JoinStatus.Rejected) {
          setStatus(JoinStatus.Rejected);
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

  useEffect(() => {
    if (
      autoFollow &&
      session.data?.user &&
      !isFinalStatus &&
      !autoFollowExecuted.current
    ) {
      autoFollowExecuted.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete('autoFollow');
      window.history.replaceState({}, '', url.toString());
      handleFollow(true);
    }
  }, [autoFollow, handleFollow, isFinalStatus, session.data?.user]);

  if (status === JoinStatus.Joined) {
    return (
      <Button
        size="lg"
        variant="secondary"
        disabled
        className="h-11 w-full font-semibold"
      >
        <BellRingIcon className="size-[18px]" />
        {t('followingCta')}
      </Button>
    );
  }

  if (status === JoinStatus.Pending) {
    return (
      <Button
        size="lg"
        variant="secondary"
        disabled
        className="h-11 w-full font-semibold"
      >
        <BellRingIcon className="size-[18px]" />
        {t('pendingCta')}
      </Button>
    );
  }

  if (status === JoinStatus.Rejected) {
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
      >
        <BellRingIcon className="size-[18px]" />
        {t('followCta')}
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">{t('followNote')}</p>
    </div>
  );
}
