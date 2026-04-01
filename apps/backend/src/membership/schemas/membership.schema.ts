import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { roles } from '../../auth/schemas/role.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const memberships = pgTable(
  'memberships',
  {
    ...idColumn,
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    roleId: uuid('role_id').references(() => roles.id, {
      onDelete: 'restrict',
    }),
    ...timestampColumns,
  },
  (table) => [
    index('idx_memberships_user_id').on(table.userId),
    index('idx_memberships_role_id').on(table.roleId),
  ],
);

export type MembershipEntity = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
