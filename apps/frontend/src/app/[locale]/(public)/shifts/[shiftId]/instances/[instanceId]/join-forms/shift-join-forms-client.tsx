'use client';

import { JoinStatus, RequiredFormTargetType } from '@repo/data';
import { useJoinShiftInstance } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  type RequiredFormItem,
  RequiredFormRenderer,
} from '@/domain/requirement-form/components/required-form-renderer';
import { useRouter } from '@/i18n/navigation';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface ShiftJoinFormsClientProps {
  shiftId: string;
  instanceId: string;
  shiftTitle: string;
  requiredForms: RequiredFormItem[];
  profileData: Record<string, string>;
  initialSubmittedFormIds: Set<string>;
  redirectTo?: string;
}

export function ShiftJoinFormsClient({
  shiftId,
  instanceId,
  shiftTitle,
  requiredForms,
  profileData,
  initialSubmittedFormIds,
  redirectTo,
}: ShiftJoinFormsClientProps) {
  const t = useTranslations('ShiftDetail.forms');
  const router = useRouter();
  const joinShiftInstance = useJoinShiftInstance();

  const handleComplete = async () => {
    try {
      const result = await joinShiftInstance.mutateAsync(instanceId);

      if (
        result.status === JoinStatus.Joined ||
        result.status === JoinStatus.Pending
      ) {
        toast.success(
          result.status === JoinStatus.Joined
            ? t('joinedToast', { shiftTitle })
            : t('requestSentToast'),
        );
        router.push(getSafeRedirect(redirectTo));
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(t('rejectedToast'));
        router.push(`/shifts/${shiftId}`);
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        toast.error(t('requirementsNeededToast'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('requestFailed'));
    }
  };

  return (
    <RequiredFormRenderer
      title={t('title', { shiftTitle })}
      description={t('description')}
      emptyMessage={t('noForms')}
      targetType={RequiredFormTargetType.Shift}
      targetId={shiftId}
      forms={requiredForms}
      profileData={profileData}
      initialSubmittedFormIds={initialSubmittedFormIds}
      onComplete={handleComplete}
    />
  );
}
