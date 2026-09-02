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

  const organization = await data.organization.findById(org.organizationId);

  if (!organization) {
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

      {canEdit && <OrganizationProfileForm organization={organization} />}
    </div>
  );
}
