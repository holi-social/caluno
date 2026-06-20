import { getTranslations } from 'next-intl/server';
import { createRole } from '@/domain/role/actions';
import { RoleForm } from '@/domain/role/components/role-form';
import { getDataClient } from '@/lib/data-client';

interface CreateRolePageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function CreateRolePage({ params }: CreateRolePageProps) {
  const { orgUId, locale } = await params;

  const dataClient = await getDataClient(orgUId);
  const permissionGroups = await dataClient.role.findPermissionGroups();
  const t = await getTranslations({ locale, namespace: 'Role.sheet' });

  return (
    <RoleForm
      title={t('createTitle')}
      description={t('createDescription')}
      organizationUnitId={orgUId}
      permissionGroups={permissionGroups}
      mutate={createRole}
    />
  );
}
