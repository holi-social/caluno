'use client';

import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FileUpload } from '@/domain/storage/components/file-upload';
import { GRAPHQL_API_URL } from '@/lib/constants';

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
  const [fileIdsByRequirement, setFileIdsByRequirement] = useState<
    Record<string, string>
  >({});
  const [isPending, startTransition] = useTransition();

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

  const submitDocuments = () => {
    startTransition(async () => {
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

      const response = await fetch(GRAPHQL_API_URL, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-unit-id': organizationUnitId,
        },
        body: JSON.stringify({
          query: `
            mutation CreateRequirementProfileSubmission($input: CreateRequirementProfileSubmissionInput!) {
              createRequirementProfileSubmission(input: $input) {
                id
              }
            }
          `,
          variables: {
            input: {
              profileId,
              membershipRequestId: membershipRequestId ?? null,
              fulfillments,
            },
          },
        }),
      });

      const body = (await response.json()) as {
        errors?: Array<{ message: string }>;
      };

      if (!response.ok || body.errors?.length) {
        toast.error(body.errors?.[0]?.message ?? t('submitFailed'));
        return;
      }

      toast.success(t('submitSuccess'));
      window.location.reload();
    });
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
