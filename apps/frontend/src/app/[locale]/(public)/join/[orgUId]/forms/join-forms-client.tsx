'use client';

import { JoinStatus, RequiredFormTargetType } from '@repo/data';
import { useJoinOrganization } from '@repo/data/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  type RequiredFormItem,
  RequiredFormRenderer,
} from '@/domain/requirement-form/components/required-form-renderer';
import { useRouter } from '@/i18n/navigation';
import { getSafeRedirect } from '@/lib/safe-redirect';

interface JoinFormsClientProps {
  orgUId: string;
  orgName: string;
  requiredForms: RequiredFormItem[];
  profileData: Record<string, string>;
  initialSubmittedFormIds: Set<string>;
  redirectTo?: string;
}

export function JoinFormsClient({
  orgUId,
  orgName,
  requiredForms,
  profileData,
  initialSubmittedFormIds,
  redirectTo,
}: JoinFormsClientProps) {
  const t = useTranslations('MembershipRequest.joinForms');
  const router = useRouter();
  const joinOrganization = useJoinOrganization();

  const handleComplete = async () => {
    try {
      const result = await joinOrganization.mutateAsync(orgUId);

      if (result.status === JoinStatus.Joined) {
        toast.success(t('joined'));
        router.push(getSafeRedirect(redirectTo, `/admin/${orgUId}`));
      } else if (result.status === JoinStatus.Pending) {
        toast.success(t('requestPending'));
        router.push(`/invite/${orgUId}`);
      } else if (result.status === JoinStatus.Rejected) {
        toast.error(t('rejected'));
        router.push(`/invite/${orgUId}`);
      } else if (result.status === JoinStatus.RequirementsNeeded) {
        toast.error(t('requirementsNeeded'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('requestFailed'));
    }
  };

  return (
    <RequiredFormRenderer
      title={t('title', { orgName })}
      description={t('description')}
      emptyMessage={t('noForms')}
      targetType={RequiredFormTargetType.OrganizationUnit}
      targetId={orgUId}
      forms={requiredForms}
      profileData={profileData}
      initialSubmittedFormIds={initialSubmittedFormIds}
      onComplete={handleComplete}
    />
  );
}
