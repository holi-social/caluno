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
  initialFollowing: boolean;
}

export function EventFollowButton({
  eventId,
  initialFollowing,
}: EventFollowButtonProps) {
  const t = useTranslations('EventDetail');
  const joinEvent = useJoinEvent();
  const searchParams = useSearchParams();
  const autoFollow = searchParams.get('autoFollow') === 'true';
  const [following, setFollowing] = useState(initialFollowing);
  const session = useSession();

  const redirectToFormsPage = useCallback(() => {
    const currentUrl = window.location.href;
    window.location.href = `/events/${eventId}/forms?redirectTo=${encodeURIComponent(currentUrl)}`;
  }, [eventId]);

  const handleFollow = useCallback(async () => {
    if (!session.data?.user) {
      const redirectTo = `/events/${eventId}?autoFollow=true`;
      window.location.href = `/api/invite?redirectTo=${encodeURIComponent(redirectTo)}`;
      return;
    }

    try {
      const result = await joinEvent.mutateAsync(eventId);

      if (result.status === JoinStatus.Joined) {
        setFollowing(true);
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('requestSentToast'));
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        const missingForms = result.requiredForms?.filter((f) => !f.submitted);
        if (missingForms && missingForms.length > 0) {
          redirectToFormsPage();
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : undefined);
    }
  }, [eventId, joinEvent, session.data?.user, t, redirectToFormsPage]);

  useEffect(() => {
    if (
      autoFollow &&
      session.data?.user &&
      !following &&
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
    following,
    joinEvent.isPending,
    session.data?.user,
  ]);

  if (following) {
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
