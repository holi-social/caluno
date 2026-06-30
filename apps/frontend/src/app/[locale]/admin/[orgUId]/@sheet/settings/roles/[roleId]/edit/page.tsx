import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { updateRole } from '@/domain/role/actions';
import { RoleForm } from '@/domain/role/components/role-form';
import { getDataClient } from '@/lib/data-client';

interface TimeEntryUpdatePageProps {
  params: Promise<{ orgUId: string; roleId: string; locale: string }>;
}

export default async function RoleUpdatePage({
  params,
}: TimeEntryUpdatePageProps) {
  const { orgUId, roleId, locale } = await params;

  const data = await getDataClient({ orgUId });
  const t = await getTranslations({ locale, namespace: 'Role.sheet' });

  const [role, permissionGroups] = await Promise.all([
    data.role.findById(roleId),
    data.role.findPermissionGroups(),
  ]);

  if (!role) {
    notFound();
  }

  return (
    <RoleForm
      title={t('editTitle')}
      description={t('editDescription')}
      organizationUnitId={orgUId}
      permissionGroups={permissionGroups}
      mutate={updateRole.bind(null, role.id)}
      initialValues={{
        organizationUnitId: orgUId,
        name: role.name,
        description: role.description ?? undefined,
        permissionIds: role.permissions.map((p) => p.id),
      }}
    />
  );
}
