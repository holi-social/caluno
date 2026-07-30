'use client';

import { JoinStatus } from '@repo/data';
import {
  type RequiredFormWithStatusFieldsFragment,
  useJoinEvent,
} from '@repo/data/react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui';
import { BellRingIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RequiredFormRenderer } from '@/domain/requirement-form/components/required-form-renderer';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth';

interface EventFollowButtonProps {
  eventId: string;
  initialFollowing: boolean;
  profileData?: Record<string, string>;
}

export function EventFollowButton({
  eventId,
  initialFollowing,
  profileData = {},
}: EventFollowButtonProps) {
  const t = useTranslations('EventDetail');
  const joinEvent = useJoinEvent();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoFollow = searchParams.get('autoFollow') === 'true';
  const [following, setFollowing] = useState(initialFollowing);
  const [requiredFormsOpen, setRequiredFormsOpen] = useState(false);
  const [pendingRequiredForms, setPendingRequiredForms] = useState<
    RequiredFormWithStatusFieldsFragment[]
  >([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const session = useSession();

  const handleJoinResult = useCallback(
    (result: {
      status: JoinStatus;
      requiredForms?: RequiredFormWithStatusFieldsFragment[] | null;
    }) => {
      if (result.status === JoinStatus.Joined) {
        setFollowing(true);
        setRequiredFormsOpen(false);
        setPendingRequiredForms([]);
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('requestSentToast'));
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        const missingForms =
          result.requiredForms?.filter((f) => !f.submitted) ?? [];
        if (missingForms.length > 0) {
          setPendingRequiredForms(missingForms);
          setActiveFormId(missingForms[0]?.form.id ?? null);
          setRequiredFormsOpen(true);
        }
      }
    },
    [t],
  );

  const handleFollow = useCallback(async () => {
    if (!session.data?.user) {
      const redirectTo = `/events/${eventId}?autoFollow=true`;
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    try {
      const result = await joinEvent.mutateAsync(eventId);
      handleJoinResult(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : undefined);
    }
  }, [eventId, joinEvent, router, session.data?.user, handleJoinResult]);

  const handleFormSubmitted = useCallback(
    async (formId: string) => {
      setActiveFormId(null);
      setPendingRequiredForms((prev) =>
        prev.filter((ref) => ref.form.id !== formId),
      );

      try {
        const result = await joinEvent.mutateAsync(eventId);
        handleJoinResult(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : undefined);
      }
    },
    [eventId, joinEvent, handleJoinResult],
  );

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

  const activeFormRef = activeFormId
    ? pendingRequiredForms.find((ref) => ref.form.id === activeFormId)
    : undefined;
  const activeForm = activeFormRef?.form;

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

      <Dialog open={requiredFormsOpen} onOpenChange={setRequiredFormsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('requiredFormsTitle')}</DialogTitle>
          </DialogHeader>
          {activeForm && activeFormRef && (
            <RequiredFormRenderer
              targetType={activeFormRef.targetType}
              targetId={activeFormRef.targetId}
              form={activeForm}
              profileData={profileData}
              onSubmitted={() => handleFormSubmitted(activeForm.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
