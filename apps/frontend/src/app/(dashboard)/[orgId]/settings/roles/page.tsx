import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { RolesTable } from './roles-table';
import { CreateRoleSheet } from '@/components/sheets/create-role-sheet';

interface RolesPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function RolesPage({ params }: RolesPageProps) {
  const { orgId } = await params;
  const { org } = await requireOrgAccess(orgId);
  const data = await getDataClient(org.id);

  const roles = await data.role.findAll();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
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
