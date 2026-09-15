import { PermissionKey } from '@repo/data';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { OrganizationProfileForm } from '@/domain/organization/components/organization-profile-form';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission, requirePermission } from '@/lib/permissions-server';

interface SettingsPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgUId, locale } = await params;
  const { org } = await requireOrgAccess(orgUId);
  await requirePermission(orgUId, PermissionKey.OrgView);

  const [canEdit] = await checkPermission(orgUId, PermissionKey.OrgEdit);

  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Settings' });

  // The organization profile lives on the root unit: the record the overview
  // edits and accounting documents read. The organization row is still fetched
  // for its logo, which the form carries through unchanged on save.
  const root = await data.organization.findRootUnit(org.organizationId);
  const [rootUnit, organization] = await Promise.all([
    root ? data.organizationUnit.findById(root.id) : Promise.resolve(null),
    data.organization.findById(org.organizationId),
  ]);

  if (!rootUnit) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('organizationProfile.subtitle')}
        </p>
      </div>

      {canEdit && (
        <OrganizationProfileForm
          rootUnitId={rootUnit.id}
          logoUrl={organization?.logoUrl ?? null}
          organization={rootUnit}
        />
      )}
    </div>
  );
}
