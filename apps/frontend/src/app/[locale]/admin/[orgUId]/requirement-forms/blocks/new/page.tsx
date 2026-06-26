import { getTranslations } from 'next-intl/server';
import { CreateBlock } from '@/domain/requirement-form/components/create-block';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function NewBlockPage({ params }: Props) {
  const { orgUId, locale } = await params;
  const { org } = await requireOrgAccess(orgUId);
  const t = await getTranslations({
    locale,
    namespace: 'RequirementForm.block',
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="page-title">{t('createTitle')}</h1>
      <CreateBlock orgUId={orgUId} organizationId={org.organizationId} />
    </div>
  );
}
