import { PermissionKey } from '@repo/data';
import { getTranslations } from 'next-intl/server';
import { OrgUnitSetup } from '@/domain/org-unit/components/org-unit-setup';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission, requirePermission } from '@/lib/permissions-server';

interface OrgUnitsPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function OrgUnitsPage({ params }: OrgUnitsPageProps) {
  const { orgUId, locale } = await params;
  const { org } = await requireOrgAccess(orgUId);
  await requirePermission(orgUId, PermissionKey.OrgView);

  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'OrgUnit' });

  const [[canEdit], tree, types] = await Promise.all([
    checkPermission(orgUId, PermissionKey.OrgEdit),
    data.organizationUnit.findOrganizationTree(),
    data.organizationUnit.findAllTypes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('page.title')}</h1>

        <p className="text-muted-foreground mt-1">
          {t('page.subtitle', { orgName: org.name })}
        </p>
      </div>

      <OrgUnitSetup
        canEdit={canEdit}
        tree={tree}
        types={types}
        organizationUnitId={orgUId}
      />
    </div>
  );
}
