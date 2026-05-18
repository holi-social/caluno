import { createRole } from '@/domain/role/actions';
import { RoleForm } from '@/domain/role/components/role-form';
import { getDataClient } from '@/lib/data-client';

interface CreateRolePageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function CreateRolePage({ params }: CreateRolePageProps) {
  const { orgUId } = await params;

  const dataClient = await getDataClient(orgUId);
  const allPermissions = await dataClient.role.findAllPermissions();

  return (
    <RoleForm
      title="Create Role"
      description="Define a new role with specific permissions."
      organizationUnitId={orgUId}
      permissions={allPermissions}
      mutate={createRole}
    />
  );
}
