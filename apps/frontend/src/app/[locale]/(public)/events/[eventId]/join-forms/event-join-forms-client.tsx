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

interface EventJoinFormsClientProps {
  eventId: string;
  eventTitle: string;
  requiredForms: RequiredFormItem[];
  profileData: Record<string, string>;
  initialSubmittedFormIds: Set<string>;
  redirectTo?: string;
}

export function EventJoinFormsClient({
  eventId,
  eventTitle,
  requiredForms,
  profileData,
  initialSubmittedFormIds,
  redirectTo,
}: EventJoinFormsClientProps) {
  const t = useTranslations('EventDetail.forms');
  const router = useRouter();
  const joinEvent = useJoinEvent();

  const handleComplete = async () => {
    try {
      const result = await joinEvent.mutateAsync(eventId);

      if (
        result.status === JoinStatus.Joined ||
        result.status === JoinStatus.Pending
      ) {
        toast.success(
          result.status === JoinStatus.Joined
            ? t('joinedToast', { eventTitle })
            : t('pendingRequestToast'),
        );
        router.push(getSafeRedirect(redirectTo));
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
