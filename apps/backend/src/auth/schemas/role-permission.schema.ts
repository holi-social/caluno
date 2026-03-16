import { pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { permissions } from './permission.schema';
import { roles } from './role.schema';

export const rolePermissions = pgTable(
  'role_permissions',
  {
    ...idColumn,
    roleId: uuid('role_id')
      .references(() => roles.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    permissionId: uuid('permission_id')
      .references(() => permissions.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_role_permissions_role_id_permission_id').on(
      table.roleId,
      table.permissionId,
    ),
  ],
);

export type RolePermissionEntity = typeof rolePermissions.$inferSelect;
export type RolePermissionInsert = typeof rolePermissions.$inferInsert;
