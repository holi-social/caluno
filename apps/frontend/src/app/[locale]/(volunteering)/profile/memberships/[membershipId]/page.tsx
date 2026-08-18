import type {
  GetMyFormSubmissionsQuery,
  MyRequiredOrgUnitFormsQuery,
} from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MembershipDetailHeader } from '@/domain/memberships/components/membership-detail-header';
import {
  type FormSubmission,
  MembershipFormCard,
} from '@/domain/memberships/components/membership-form-card';
import { MembershipStatusBadge } from '@/domain/memberships/components/membership-status-badge';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';

type OrgUnitForm =
  MyRequiredOrgUnitFormsQuery['myRequiredOrgUnitForms'][number];
type MyFormSubmissionItem =
  GetMyFormSubmissionsQuery['myFormSubmissions'][number];

const mergeOrgUnitFormsWithSubmissions = (
  forms: OrgUnitForm[],
  submissions: MyFormSubmissionItem[],
): FormSubmission[] => {
  const mergedByFormId = new Map<string, FormSubmission>();
  for (const form of forms) {
    mergedByFormId.set(form.id, {
      form,
      completed: false,
    });
  }

  for (const submission of submissions) {
    if (submission.form) {
      mergedByFormId.set(submission.form.id, {
        form: submission.form,
        completed: true,
        submissionId: submission.id,
        submittedAt: submission.submittedAt,
      });
    }
  }

  return [...mergedByFormId.values()];
};

type Props = { params: Promise<{ membershipId: string }> };

export default async function MembershipDetailPage({ params }: Props) {
  const { membershipId } = await params;

  const data = await getDataClient();
  const membership = await data.membership.findMineById(membershipId);
  if (!membership) notFound();

  const organizationUnitId = membership.organizationUnit.id;
  const [requiredForms, submissions] = await Promise.all([
    data.requirementForm.findMyRequiredOrgUnitForms(organizationUnitId),
    data.requirementForm.findMyFormSubmissions(organizationUnitId),
  ]);
  const forms = mergeOrgUnitFormsWithSubmissions(requiredForms, submissions);

  const t = await getTranslations('MembershipDetail');
  const { formatDate } = await getFormatting();

  const orgUnit = membership.organizationUnit;
  const title = orgUnit.parent
    ? `${orgUnit.organization.name} · ${orgUnit.name}`
    : orgUnit.organization.name;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30">
        <MembershipDetailHeader title={title} logoUrl={orgUnit.logoUrl} />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <section className="space-y-1">
          <MembershipStatusBadge state="accepted" />
          <p className="text-muted-foreground">
            {t('role')} · {membership.roles.map((r) => r.name).join(', ')}
          </p>
          <p className="text-muted-foreground">
            {t('joinedDate', {
              date: formatDate(new Date(membership.createdAt)),
            })}
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{t('forms.title')}</h2>
            <p className="text-muted-foreground text-sm">
              {t('forms.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {forms.map((submission) => (
              <MembershipFormCard
                key={submission.form.id}
                submission={submission}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
