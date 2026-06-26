import { getTranslations } from 'next-intl/server';
import { CreateForm } from '@/domain/requirement-form/components/create-form';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function NewFormPage({ params }: Props) {
  const { orgUId, locale } = await params;
  const { org } = await requireOrgAccess(orgUId);
  const t = await getTranslations({
    locale,
    namespace: 'RequirementForm.form',
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="page-title">{t('createTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('createSubtitle')}</p>
      </div>

      <CreateForm orgUId={orgUId} organizationId={org.organizationId} />
    </div>
  );
}
