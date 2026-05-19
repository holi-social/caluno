import { notFound } from 'next/navigation';
import { updateRole } from '@/domain/role/actions';
import { RoleForm } from '@/domain/role/components/role-form';
import { getDataClient } from '@/lib/data-client';

interface TimeEntryUpdatePageProps {
  params: Promise<{ orgUId: string; roleId: string }>;
}

export default async function RoleUpdatePage({
  params,
}: TimeEntryUpdatePageProps) {
  const { orgUId, roleId } = await params;

  const data = await getDataClient(orgUId);

  const [role, permissionGroups] = await Promise.all([
    data.role.findById(roleId),
    data.role.findPermissionGroups(),
  ]);

  if (!role) {
    notFound();
  }

  return (
    <RoleForm
      title="Edit Role"
      description="Update permissions for the role"
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
