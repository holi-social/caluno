import { PermissionKey } from '@repo/data';
import { CreateRoleSheet } from '@/components/sheets/create-role-sheet';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { requirePermission } from '@/lib/permissions-server';
import { RolesTable } from './roles-table';

interface RolesPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { orgUId } = await params;
  const { org } = await requireOrgAccess(orgUId);
  await requirePermission(orgUId, PermissionKey.RoleRead);
  const data = await getDataClient(orgUId);

  const roles = await data.role.findAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Roles</h1>
          <p className="text-muted-foreground mt-1">
            Manage roles and permissions for {org.name}
          </p>
        </div>
        <CreateRoleSheet />
      </div>

      {roles.length > 0 ? (
        <RolesTable roles={roles} />
      ) : (
        <div className="text-muted-foreground">
          No roles yet. Create your first role to get started.
        </div>
      )}
    </div>
  );
}
