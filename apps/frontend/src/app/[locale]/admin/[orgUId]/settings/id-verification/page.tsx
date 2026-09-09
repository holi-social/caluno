import { PermissionKey } from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { IdVerificationSettingsCard } from '@/domain/org-unit/components/id-verification-settings-card';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission, requirePermission } from '@/lib/permissions-server';

interface IdVerificationSettingsPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function IdVerificationSettingsPage({
  params,
}: IdVerificationSettingsPageProps) {
  const { orgUId, locale } = await params;
  const { org } = await requireOrgAccess(orgUId);
  await requirePermission(orgUId, PermissionKey.OrgView);
  const [canEdit = false] = await checkPermission(
    orgUId,
    PermissionKey.OrgEdit,
  );
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'IdVerification' });

  const orgUnit = await data.organizationUnit.findById(orgUId);
  if (!orgUnit) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('page.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('page.subtitle', { orgName: org.name })}
        </p>
      </div>

      <IdVerificationSettingsCard
        organizationUnitId={orgUId}
        organizationId={orgUnit.organizationId}
        initialEnabled={orgUnit.idVerificationEnabled ?? false}
        canEdit={canEdit}
      />
    </div>
  );
}
