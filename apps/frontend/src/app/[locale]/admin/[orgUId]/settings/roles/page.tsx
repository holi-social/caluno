import { PermissionKey } from '@repo/data';
import { Button } from '@repo/ui';
import { PlusIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { RolesTable } from '@/domain/role/components/roles-table';
import { Link } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission, requirePermission } from '@/lib/permissions-server';

interface RolesPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { orgUId, locale } = await params;
  const { org } = await requireOrgAccess(orgUId);
  await requirePermission(orgUId, PermissionKey.OrgView);
  const [canEdit] = await checkPermission(orgUId, PermissionKey.OrgEdit);
  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Role' });

  const roles = await data.role.findAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('page.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('page.subtitle', { orgName: org.name })}
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/admin/${orgUId}/settings/roles/new`}>
              <PlusIcon />
              {t('page.createButton')}
            </Link>
          </Button>
        )}
      </div>

      {roles.length > 0 ? (
        <RolesTable roles={roles} />
      ) : (
        <div className="text-muted-foreground">{t('page.empty')}</div>
      )}
    </div>
  );
}
