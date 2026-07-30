'use client';

import { JoinStatus, RequiredFormTargetType } from '@repo/data';
import { useJoinEvent } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  type RequiredFormItem,
  RequiredFormRenderer,
} from '@/domain/requirement-form/components/required-form-renderer';
import { useRouter } from '@/i18n/navigation';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface EventFormsClientProps {
  eventId: string;
  eventTitle: string;
  requiredForms: RequiredFormItem[];
  profileData: Record<string, string>;
  initialSubmittedFormIds: Set<string>;
  redirectTo?: string;
}

export function EventFormsClient({
  eventId,
  eventTitle,
  requiredForms,
  profileData,
  initialSubmittedFormIds,
  redirectTo,
}: EventFormsClientProps) {
  const t = useTranslations('EventDetail.forms');
  const router = useRouter();
  const joinEvent = useJoinEvent();

  const handleComplete = async () => {
    try {
      const result = await joinEvent.mutateAsync(eventId);

      if (result.status === JoinStatus.Joined) {
        toast.success(t('joinedToast', { eventTitle }));
        router.push(getSafeRedirect(redirectTo) ?? `/events/${eventId}`);
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('requestSentToast'));
        router.push(`/events/${eventId}`);
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(t('rejectedToast'));
        router.push(`/events/${eventId}`);
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        toast.error(t('requirementsNeededToast'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('requestFailed'));
    }
  };

  return (
    <RequiredFormRenderer
      title={t('title', { eventTitle })}
      description={t('description')}
      emptyMessage={t('noForms')}
      targetType={RequiredFormTargetType.Event}
      targetId={eventId}
      forms={requiredForms}
      profileData={profileData}
      initialSubmittedFormIds={initialSubmittedFormIds}
      onComplete={handleComplete}
    />
  );
}
