import { Badge, Card, CardContent } from '@repo/ui';
import { Lock, Shield, ShieldCheck, Unlock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { ActionBar } from '@/domain/role/components/action-bar';
import { getDataClient } from '@/lib/data-client';

interface RoleDetailsPageProps {
  params: Promise<{ orgUId: string; roleId: string }>;
}

export default async function RoleDetailsPage({
  params,
}: RoleDetailsPageProps) {
  const { orgUId, roleId } = await params;

  const data = await getDataClient(orgUId);
  const [role, permissionGroups] = await Promise.all([
    data.role.findById(roleId),
    data.role.findPermissionGroups(),
  ]);

  if (!role) {
    notFound();
  }

  const rolePermissionIds = new Set(role.permissions.map((p) => p.id));
  const assignedGroups = permissionGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        rolePermissionIds.has(item.permission.id),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="page-title mb-1">{role.name}</h1>
          <p className="text-muted-foreground">{role.description}</p>
        </div>
        <ActionBar
          id={role.id}
          isInternal={role.isInternal}
          organizationUnitId={orgUId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent>
              {assignedGroups.length === 0 ? (
                <p className="text-muted-foreground">
                  No permissions assigned to this role.
                </p>
              ) : (
                <div className="space-y-4">
                  {assignedGroups.map((group) => (
                    <div key={group.key}>
                      <h3 className="text-sm mb-2">{group.label}</h3>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <Badge
                            key={item.permission.id}
                            variant="secondary"
                            title={item.permission.description ?? undefined}
                          >
                            {item.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
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
