import { notFound } from 'next/navigation';
import { FormBuilder } from '@/domain/requirement-form/components/form-builder';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string; formId: string }>;
}

export default async function BuilderPage({ params }: Props) {
  const { orgUId, formId } = await params;
  const { org } = await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

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
          {form.description ?? 'Build your form by adding blocks'}
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
