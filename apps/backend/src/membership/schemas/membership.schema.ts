import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';

export const memberships = pgTable(
  'memberships',
  {
    ...idColumn,
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    organizationUnitId: uuid('organization_unit_id').references(
      () => organizationUnits.id,
      {
        onDelete: 'cascade',
      },
    ),
    ...timestampColumns,
  },
  (table) => [
    index('idx_memberships_user_id').on(table.userId),
    index('idx_memberships_organization_unit_id').on(table.organizationUnitId),
  ],
);

export type MembershipEntity = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
