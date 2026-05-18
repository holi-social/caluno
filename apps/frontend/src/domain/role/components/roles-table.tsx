'use client';

import type { RoleListItem } from '@repo/data';
import { useOrgUId } from '@repo/data/react';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import Link from 'next/link';
import { ActionBar } from './action-bar';

interface RolesTableProps {
  roles: RoleListItem[];
}

export function RolesTable({ roles }: RolesTableProps) {
  const orgUId = useOrgUId();

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
                  <Link
                    href={`/${orgUId}/settings/roles/${role.id}`}
                    className="hover:underline"
                  >
                    {role.name}
                  </Link>
                  {role.isInternal && <Badge variant="secondary">System</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {role.description || '-'}
              </TableCell>
              <TableCell>{role.permissions.length} permissions</TableCell>
              <TableCell>
                <ActionBar
                  id={role.id}
                  isInternal={role.isInternal}
                  organizationUnitId={orgUId}
                  size="xs"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
