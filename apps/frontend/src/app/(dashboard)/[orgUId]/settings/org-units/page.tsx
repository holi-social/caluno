import { PermissionKey } from '@repo/data';
import { OrgUnitSetup } from '@/domain/org-unit/components/org-unit-setup';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { checkPermission, requirePermission } from '@/lib/permissions-server';

interface OrgUnitsPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function OrgUnitsPage({ params }: OrgUnitsPageProps) {
  const { orgUId } = await params;
  const { org } = await requireOrgAccess(orgUId);
  await requirePermission(orgUId, PermissionKey.OrgUnitRead);

  const data = await getDataClient(orgUId);

  const [[canCreate, canEdit, canDelete], tree, types] = await Promise.all([
    await checkPermission(
      orgUId,
      PermissionKey.OrgUnitCreate,
      PermissionKey.OrgUnitUpdate,
      PermissionKey.OrgUnitDelete,
    ),
    data.organizationUnit.findTree(org.organizationId),
    data.organizationUnit.findAllTypes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Org Units</h1>

        <p className="text-muted-foreground mt-1">
          Manage the organizational unit hierarchy for {org.name}
        </p>
      </div>

      <OrgUnitSetup
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        tree={tree}
        types={types}
        organizationUnitId={orgUId}
      />
    </div>
  );
}
