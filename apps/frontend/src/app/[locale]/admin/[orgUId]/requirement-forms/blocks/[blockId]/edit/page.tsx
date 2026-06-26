import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EditBlockForm } from '@/domain/requirement-form/components/edit-block-form';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string; blockId: string; locale: string }>;
}

export default async function EditBlockPage({ params }: Props) {
  const { orgUId, blockId, locale } = await params;
  await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);
  const t = await getTranslations({
    locale,
    namespace: 'RequirementForm.block',
  });

  const block = await data.requirementForm.findBlockById(blockId);
  if (!block) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="page-title">{t('editTitle')}</h1>
      <EditBlockForm block={block} orgUId={orgUId} />
    </div>
  );
}
