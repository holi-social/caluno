'use client';

import { JoinStatus } from '@repo/data';
import { useJoinEvent } from '@repo/data/react';
import { Button } from '@repo/ui';
import { BellRingIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth';

interface EventFollowButtonProps {
  eventId: string;
  initialStatus: JoinStatus;
}

export function EventFollowButton({
  eventId,
  initialStatus,
}: EventFollowButtonProps) {
  const t = useTranslations('EventDetail');
  const joinEvent = useJoinEvent();
  const searchParams = useSearchParams();
  const autoFollow = searchParams.get('autoFollow') === 'true';
  const [status, setStatus] = useState(initialStatus);
  const session = useSession();

  const handleFollow = useCallback(async () => {
    if (!session.data?.user) {
      const redirectTo = `/events/${eventId}?autoFollow=true`;
      window.location.href = `/api/invite?redirectTo=${encodeURIComponent(redirectTo)}`;
      return;
    }

    try {
      const result = await joinEvent.mutateAsync(eventId);
      setStatus(result.status);

      if (result.status === JoinStatus.Pending) {
        toast.success(t('requestSentToast'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : undefined);
    }
  }, [eventId, joinEvent, session.data?.user, t]);

  useEffect(() => {
    if (
      autoFollow &&
      session.data?.user &&
      status === JoinStatus.None &&
      !joinEvent.isPending
    ) {
      const url = new URL(window.location.href);
      url.searchParams.delete('autoFollow');
      window.history.replaceState({}, '', url.toString());
      handleFollow();
    }
  }, [
    autoFollow,
    handleFollow,
    status,
    joinEvent.isPending,
    session.data?.user,
  ]);

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
      <div>
        <Button
          size="lg"
          variant="secondary"
          disabled
          className="h-11 w-full font-semibold"
        >
          {t('pendingCta')}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">{t('pendingNote')}</p>
      </div>
    );
  }

  if (status === JoinStatus.Rejected) {
    return (
      <Button
        size="lg"
        variant="outline"
        disabled
        className="h-11 w-full font-semibold"
      >
        {t('rejectedCta')}
      </Button>
    );
  }

  return (
    <div>
      <Button
        size="lg"
        variant="outline"
        onClick={handleFollow}
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
