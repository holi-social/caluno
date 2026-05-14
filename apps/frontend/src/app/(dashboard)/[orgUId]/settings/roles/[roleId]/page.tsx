import { Badge, Card, CardContent } from '@repo/ui';
import { Lock, Shield, ShieldCheck, Unlock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ActionBar } from '@/domain/role/components/action-bar';
import { getActionLabel, groupPermissions } from '@/domain/role/grouping';
import { getDataClient } from '@/lib/data-client';

interface RoleDetailsPageProps {
  params: Promise<{ orgUId: string; roleId: string }>;
}

export default async function RoleDetailsPage({
  params,
}: RoleDetailsPageProps) {
  const { orgUId, roleId } = await params;

  const data = await getDataClient(orgUId);
  const role = await data.role.findById(roleId);

  if (!role) {
    notFound();
  }

  const permissionGroups = groupPermissions(role.permissions);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="page-title mb-1">{role.name}</h1>
          <p className="text-muted-foreground">{role.description}</p>
        </div>
        <ActionBar role={role} organizationUnitId={orgUId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent>
              {permissionGroups.size === 0 ? (
                <p className="text-muted-foreground">
                  No permissions assigned to this role.
                </p>
              ) : (
                <div className="space-y-4">
                  {Array.from(permissionGroups.entries()).map(
                    ([groupName, permissions]) => (
                      <div key={groupName}>
                        <h3 className="text-sm mb-2">{groupName}</h3>
                        <div className="flex flex-wrap gap-2">
                          {permissions.map((permission) => (
                            <Badge
                              key={permission.id}
                              variant="secondary"
                              title={permission.description ?? undefined}
                            >
                              {getActionLabel(permission.key)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <Shield className="size-4 shrink-0" /> Type
                  </dt>
                  <dd className="ml-6">
                    {role.isInternal ? (
                      <Badge variant="secondary">
                        <Lock /> System
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Unlock /> Custom
                      </Badge>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground mb-2 flex gap-2 items-center">
                    <ShieldCheck className="size-4 shrink-0" />
                    Total permissions
                  </dt>
                  <dd className="ml-6">{role.permissions.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
