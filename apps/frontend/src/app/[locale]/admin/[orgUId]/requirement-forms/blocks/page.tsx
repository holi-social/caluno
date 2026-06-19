import { BlockCard } from '@/domain/requirement-form/components/block-card';
import { CreateBlockButton } from '@/domain/requirement-form/components/create-block-button';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string }>;
}

export default async function BlocksPage({ params }: Props) {
  const { orgUId } = await params;
  const { org } = await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

  const [blocksResult, formsResult] = await Promise.all([
    data.requirementForm.findBlocks(org.organizationId, {
      limit: 50,
      offset: 0,
    }),
    data.requirementForm.findForms(org.organizationId, {
      limit: 100,
      offset: 0,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Block Library</h1>
          <p className="text-muted-foreground mt-1">
            Reusable blocks for your forms
          </p>
        </div>
        <CreateBlockButton size="lg" />
      </div>

      {blocksResult.items.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h3 className="text-lg font-semibold">No blocks yet</h3>
          <p className="text-muted-foreground mt-2">
            Create reusable blocks to use across multiple forms.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocksResult.items.map((block) => (
            <BlockCard key={block.id} block={block} forms={formsResult.items} />
          ))}
        </div>
      )}
    </div>
  );
}
