import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FormSubmissionsClient } from '@/domain/requirement-form/components/form-submissions-client';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string; formId: string; locale: string }>;
}

export default async function FormSubmissionsPage({ params }: Props) {
  const { orgUId, formId } = await params;
  await requireOrgAccess(orgUId);
  const data = await getDataClient({ orgUId });
  const t = await getTranslations('RequirementForm.submissions');

  const form = await data.requirementForm.findFormById(formId);
  if (!form) {
    notFound();
  }

  const submissions = await data.requirementForm.findSubmissionsByForm(formId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('title', { formName: form.name })}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>
      <FormSubmissionsClient orgUId={orgUId} submissions={submissions.items} />
    </div>
  );
}
