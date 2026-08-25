import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SubmissionView } from '@/domain/requirement-form/components/submission-view';
import { getDataClient } from '@/lib/data-client';

interface Props {
  params: Promise<{ orgUId: string; submissionId: string; locale: string }>;
}

export default async function FormSubmissionPage({ params }: Props) {
  const { orgUId, submissionId, locale } = await params;
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'RequirementForm' });

  const submission =
    await data.requirementForm.findAdminSubmission(submissionId);

  if (!submission) {
    notFound();
  }

  const userProfile = submission.user?.id
    ? await data.requirementProfile.getAdminUserProfile(submission.user.id)
    : null;

  const volunteerName =
    submission.user?.name ?? t('submission.fallbackVolunteer');
  const formName = submission.form?.name ?? t('submission.fallbackForm');
  const submissionValues = (submission.values ?? []) as {
    fieldId: string;
    value: string;
  }[];
  const profileData = (userProfile?.data ?? {}) as Record<string, unknown>;

  const fields =
    submission.form?.blockRefs
      ?.slice()
      .sort((a, b) => a.fieldOrder - b.fieldOrder)
      .flatMap((ref) => ref.block?.fields ?? []) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{volunteerName}</h1>
        <p className="text-muted-foreground mt-1">{formName}</p>
      </div>

      <SubmissionView
        fields={fields}
        submissionValues={submissionValues}
        profileData={profileData}
      />
    </div>
  );
}
