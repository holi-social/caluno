import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { MembershipDetailHeader } from '@/domain/memberships/components/membership-detail-header';
import { SubmissionView } from '@/domain/requirement-form/components/submission-view';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';

type Props = {
  params: Promise<{ locale: string; submissionId: string }>;
};

export default async function FormSubmissionPage({ params }: Props) {
  const { submissionId } = await params;

  const data = await getDataClient();
  const submission = await data.requirementForm.findMySubmission(submissionId);
  if (!submission) notFound();

  const t = await getTranslations('MembershipDetail.submission');
  const { formatDate } = await getFormatting();

  const fields =
    submission.form?.blockRefs
      ?.slice()
      .sort((a, b) => a.fieldOrder - b.fieldOrder)
      .flatMap((ref) => ref.block?.fields ?? []) ?? [];

  return (
    <div>
      <div className="sticky top-0 z-30">
        <MembershipDetailHeader title={submission.form?.name} />
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-6">
        <p className="text-muted-foreground mt-1">
          {t('submittedOn', {
            date: formatDate(new Date(submission.submittedAt)),
          })}
        </p>
        <SubmissionView
          fields={fields}
          submissionValues={submission.values ?? []}
        />
      </div>
    </div>
  );
}
