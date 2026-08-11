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
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth';

interface EventFollowButtonProps {
  eventId: string;
  initialStatus: JoinStatus;
  eventRequiredForms?: RequiredForm[];
  organizationUnitRequiredForms?: RequiredForm[];
}

export function EventFollowButton({
  eventId,
  initialStatus,
  eventRequiredForms = [],
  organizationUnitRequiredForms = [],
}: EventFollowButtonProps) {
  const t = useTranslations('EventDetail');
  const joinEvent = useJoinEvent();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const autoFollow = searchParams.get('autoFollow') === 'true';
  const autoFollowExecuted = useRef(false);
  const [status, setStatus] = useState(initialStatus);
  const session = useSession();

  const isFinalStatus =
    status === JoinStatus.Joined ||
    status === JoinStatus.Pending ||
    status === JoinStatus.Rejected;

  const needsCombinedForms =
    status === JoinStatus.None &&
    eventRequiredForms.length > 0 &&
    organizationUnitRequiredForms.length > 0;

  const redirectToCombinedFormsPage = useCallback(() => {
    router.push(`/events/${eventId}/join-forms?redirectTo=/`);
  }, [eventId, router]);

  const handleFollow = useCallback(
    async (isAuto = false) => {
      if (!session.data?.user) {
        const baseRedirectTo = `/events/${eventId}?${new URLSearchParams({
          ...(needsCombinedForms
            ? { showJoinForms: 'true' }
            : { autoFollow: 'true' }),
        })}`;
        const searchParams = new URLSearchParams({
          signup: '1',
          redirectTo: baseRedirectTo,
        });
        router.push(`/api/invite?${searchParams}`);
        return;
      }

      if (needsCombinedForms) {
        redirectToCombinedFormsPage();
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
      joinEvent,
      router,
      session.data?.user,
      pathname,
      redirectToCombinedFormsPage,
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
