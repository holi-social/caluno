'use client';

import { type RoleListItem, PermissionKey } from '@repo/data';
import { useOrgId } from '@repo/data/react';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { RequirePermission } from '@/components/require-permission';
import { DeleteRoleDialog } from '@/domain/role/components/delete-role-dialog';
import { EditRoleSheet } from '@/domain/role/components/edit-role-sheet';

interface RolesTableProps {
  roles: RoleListItem[];
}

export function RolesTable({ roles }: RolesTableProps) {
  const orgId = useOrgId();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead className="w-25" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {role.name}
                {role.isInternal && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {role.description || '-'}
            </TableCell>
            <TableCell>{role.permissions.length} permissions</TableCell>
            <TableCell>
              {!role.isInternal && (
                <div className="flex items-center gap-1">
                  <RequirePermission permission={PermissionKey.RoleUpdate}>
                    <EditRoleSheet
                      role={role}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </RequirePermission>
                  <RequirePermission permission={PermissionKey.RoleDelete}>
                    <DeleteRoleDialog
                      roleId={role.id}
                      roleName={role.name}
                      organizationId={orgId}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </RequirePermission>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
