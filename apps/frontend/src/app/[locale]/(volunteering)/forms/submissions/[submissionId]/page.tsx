import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MembershipDetailHeader } from '@/domain/memberships/components/membership-detail-header';
import { SubmissionView } from '@/domain/requirement-form/components/submission-view';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

type Props = {
  params: Promise<{ locale: string; submissionId: string }>;
};

export default async function FormSubmissionPage({ params }: Props) {
  const { locale: rawLocale, submissionId } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const data = await getDataClient();
  const submission = await data.requirementForm.findMySubmission(submissionId);
  if (!submission) notFound();

  const t = await getTranslations('MembershipDetail.submission');

  const fields =
    submission.form?.blockRefs
      ?.slice()
      .sort((a, b) => a.fieldOrder - b.fieldOrder)
      .flatMap((ref) => ref.block?.fields ?? []) ?? [];

  return (
    <div className="space-y-6">
      <MembershipDetailHeader />
      <div>
        <h1 className="page-title">{submission.form?.name}</h1>
        <p className="text-muted-foreground mt-1">
          {t('submittedOn', {
            date: new Date(submission.submittedAt).toLocaleDateString(locale),
          })}
        </p>
      </div>
      <SubmissionView
        fields={fields}
        submissionValues={submission.values ?? []}
      />
    </div>
  );
}
