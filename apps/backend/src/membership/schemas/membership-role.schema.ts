import { index, pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { roles } from '../../auth/schemas/role.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { memberships } from './membership.schema';

export const membershipRoles = pgTable(
  'membership_roles',
  {
    ...idColumn,
    membershipId: uuid('membership_id')
      .references(() => memberships.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: uuid('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_membership_roles_membership_id_role_id').on(
      table.membershipId,
      table.roleId,
    ),
    index('idx_membership_roles_membership_id').on(table.membershipId),
    index('idx_membership_roles_role_id').on(table.roleId),
  ],
);

export type MembershipRoleEntity = typeof membershipRoles.$inferSelect;
export type MembershipRoleInsert = typeof membershipRoles.$inferInsert;
