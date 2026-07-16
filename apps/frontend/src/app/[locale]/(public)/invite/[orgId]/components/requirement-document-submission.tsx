'use client';

import { useCreateRequirementProfileSubmission } from '@repo/data/react';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileUpload } from '@/domain/storage/components/file-upload';
import { useRouter } from '@/i18n/navigation';

interface Requirement {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  mandatory: boolean;
}

interface RequirementStatus {
  requirementId: string;
  name: string;
  status: string;
}

interface RequirementDocumentSubmissionProps {
  organizationUnitId: string;
  profileId: string;
  membershipRequestId?: string | null;
  requirements: Requirement[];
  requirementStatuses: RequirementStatus[];
}

export function RequirementDocumentSubmission({
  organizationUnitId,
  profileId,
  membershipRequestId,
  requirements,
  requirementStatuses,
}: RequirementDocumentSubmissionProps) {
  const t = useTranslations('MembershipRequest.invite.requirements');
  const router = useRouter();
  const [fileIdsByRequirement, setFileIdsByRequirement] = useState<
    Record<string, string>
  >({});
  const { mutateAsync, isPending } = useCreateRequirementProfileSubmission();

  const pendingDocumentRequirements = useMemo(() => {
    const statusMap = new Map(
      requirementStatuses.map((status) => [
        status.requirementId,
        status.status,
      ]),
    );

    return requirements.filter(
      (requirement) =>
        requirement.type === 'DOCUMENT' &&
        (statusMap.get(requirement.id) ?? 'PENDING') === 'PENDING',
    );
  }, [requirements, requirementStatuses]);

  if (pendingDocumentRequirements.length === 0) {
    return null;
  }

  const submitDocuments = async () => {
    const fulfillments = pendingDocumentRequirements
      .map((requirement) => {
        const fileId = fileIdsByRequirement[requirement.id];
        if (!fileId) {
          return null;
        }

        return {
          requirementId: requirement.id,
          fileId,
        };
      })
      .filter((fulfillment) => fulfillment !== null);

    if (fulfillments.length !== pendingDocumentRequirements.length) {
      toast.error(t('missingDocuments'));
      return;
    }

    try {
      await mutateAsync({
        profileId,
        membershipRequestId,
        fulfillments,
      });
      toast.success(t('submitSuccess'));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('submitFailed');
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">{t('documentsTitle')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('documentsDescription')}
        </p>
      </div>

      {pendingDocumentRequirements.map((requirement) => (
        <div key={requirement.id} className="space-y-2">
          <p className="text-sm font-medium">{requirement.name}</p>
          <FileUpload
            purpose="requirement_document"
            organizationUnitId={organizationUnitId}
            hideLabel
            value={fileIdsByRequirement[requirement.id]}
            disabled={isPending}
            onUploaded={(result) => {
              setFileIdsByRequirement((current) => ({
                ...current,
                [requirement.id]: result.fileId,
              }));
            }}
            onClear={() => {
              setFileIdsByRequirement((current) => {
                const next = { ...current };
                delete next[requirement.id];
                return next;
              });
            }}
          />
        </div>
      ))}

      <Button type="button" disabled={isPending} onClick={submitDocuments}>
        {isPending ? t('submitting') : t('submitDocuments')}
      </Button>
    </div>
  );
}
