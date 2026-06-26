import { DashboardContent } from '@/domain/requirement-form/components/dashboard-content';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function RequirementFormsPage({ params }: Props) {
  const { orgUId } = await params;
  const { org } = await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

  const [formsResult, blocksResult] = await Promise.all([
    data.requirementForm.findForms(org.organizationId, {
      limit: 100,
      offset: 0,
    }),
    data.requirementForm.findBlocks(org.organizationId, {
      limit: 100,
      offset: 0,
    }),
  ]);

  return (
    <DashboardContent
      forms={formsResult.items}
      blocks={blocksResult.items}
      orgUId={orgUId}
      orgUnitName={org.name}
      organizationId={org.organizationId}
    />
  );
}
