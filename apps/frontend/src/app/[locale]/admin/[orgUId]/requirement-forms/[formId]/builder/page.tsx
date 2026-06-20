import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FormBuilder } from '@/domain/requirement-form/components/form-builder';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string; formId: string; locale: string }>;
}

export default async function BuilderPage({ params }: Props) {
  const { orgUId, formId, locale } = await params;
  const { org } = await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);
  const t = await getTranslations({
    locale,
    namespace: 'RequirementForm.builder',
  });

  const form = await data.requirementForm.findFormById(formId);
  if (!form) {
    notFound();
  }

  const blocksResult = await data.requirementForm.findBlocks(
    org.organizationId,
    {
      limit: 100,
      offset: 0,
    },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{form.name}</h1>
        <p className="text-muted-foreground mt-1">
          {form.description ?? t('descriptionFallback')}
        </p>
      </div>
      <FormBuilder
        form={form}
        availableBlocks={blocksResult.items}
        orgUId={orgUId}
      />
    </div>
  );
}
