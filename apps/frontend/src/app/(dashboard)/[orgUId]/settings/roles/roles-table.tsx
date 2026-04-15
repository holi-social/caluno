'use client';

import { PermissionKey, type RoleListItem } from '@repo/data';
import { useOrgUId } from '@repo/data/react';
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
import { Edit, TrashIcon } from 'lucide-react';
import { RequirePermission } from '@/components/require-permission';
import { DeleteRoleDialog } from '@/domain/role/components/delete-role-dialog';
import {
  EditRoleSheet,
  FORM_ID,
} from '@/domain/role/components/edit-role-sheet';
import { useSheetTrigger } from '@/hooks/use-sheet';

interface RolesTableProps {
  roles: RoleListItem[];
}

export function RolesTable({ roles }: RolesTableProps) {
  const orgUId = useOrgUId();
  const { open: openEditRoleSheet } = useSheetTrigger(FORM_ID);

  return (
    <div className="rounded-md border overflow-x-auto">
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
                  {role.isInternal && <Badge variant="secondary">System</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {role.description || '-'}
              </TableCell>
              <TableCell>{role.permissions.length} permissions</TableCell>
              <TableCell>
                {!role.isInternal && (
                  <div className="flex items-center gap-2">
                    <RequirePermission permission={PermissionKey.RoleUpdate}>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        aria-label="Edit a roles permissions"
                        onClick={() => openEditRoleSheet({ id: role.id })}
                      >
                        <Edit />
                      </Button>
                      <EditRoleSheet role={role} />
                    </RequirePermission>
                    <RequirePermission permission={PermissionKey.RoleDelete}>
                      <DeleteRoleDialog
                        roleId={role.id}
                        roleName={role.name}
                        organizationUnitId={orgUId}
                        trigger={
                          <Button
                            variant="destructive"
                            size="icon-xs"
                            aria-label="Delete role"
                          >
                            <TrashIcon />
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
    </div>
  );
}
