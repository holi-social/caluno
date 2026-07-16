'use client';

import {
  useFormSubmissionsForVolunteer,
  useOrganizationUnit,
  useOrgUId,
} from '@repo/data/react';
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface MembershipRequestRequiredFormsProps {
  userId: string;
  organizationUnitId: string;
}

export function MembershipRequestRequiredForms({
  userId,
  organizationUnitId,
}: MembershipRequestRequiredFormsProps) {
  const t = useTranslations('MembershipRequest.requiredForms');
  const orgUId = useOrgUId();
  const { data: orgUnit } = useOrganizationUnit(organizationUnitId);
  const { data: submissions } = useFormSubmissionsForVolunteer(userId);

  const requiredForms = orgUnit?.requiredForms ?? [];

  const submittedFormIds = new Set(
    (submissions ?? [])
      .filter((s) => s.status === 'SUBMITTED')
      .map((s) => s.form?.id)
      .filter(Boolean),
  );

  if (!orgUnit?.requiredFormsEnabled || requiredForms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('title')}
      </p>
      <div className="space-y-2">
        {requiredForms.map((ref) => {
          const isSubmitted = submittedFormIds.has(ref.form.id);
          const submission = (submissions ?? []).find(
            (s) => s.form?.id === ref.form.id,
          );
          return (
            <div
              key={ref.form.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                {isSubmitted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-amber-500" />
                )}
                <span>{ref.form.name}</span>
              </div>
              {isSubmitted && submission && (
                <Link
                  href={`/admin/${orgUId}/volunteers/form-submission/${submission.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function useRequiredFormsSatisfied(
  userId: string,
  organizationUnitId: string,
): boolean {
  const { data: orgUnit } = useOrganizationUnit(organizationUnitId);
  const { data: submissions } = useFormSubmissionsForVolunteer(userId);

  const requiredForms = orgUnit?.requiredForms ?? [];
  if (!orgUnit?.requiredFormsEnabled || requiredForms.length === 0) {
    return true;
  }

  const submittedFormIds = new Set(
    (submissions ?? [])
      .filter((s) => s.status === 'SUBMITTED')
      .map((s) => s.form?.id)
      .filter(Boolean),
  );

  return requiredForms.every((ref) => submittedFormIds.has(ref.form.id));
}
