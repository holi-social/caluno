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
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ActionBar } from './action-bar';

interface RolesTableProps {
  roles: RoleListItem[];
}

export function RolesTable({ roles }: RolesTableProps) {
  const orgUId = useOrgUId();
  const t = useTranslations('Role');
  const tCommon = useTranslations('Common');

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.name')}</TableHead>
            <TableHead>{t('table.description')}</TableHead>
            <TableHead>{t('table.permissions')}</TableHead>
            <TableHead className="w-25" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/${orgUId}/settings/roles/${role.id}`}
                    className="hover:underline"
                  >
                    {role.name}
                  </Link>
                  {role.isInternal && (
                    <Badge variant="secondary">{t('table.systemBadge')}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {role.description || tCommon('dash')}
              </TableCell>
              <TableCell>
                {t('table.permissionsCount', { n: role.permissions.length })}
              </TableCell>
              <TableCell className="text-right">
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
