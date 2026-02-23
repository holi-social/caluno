import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { users } from '../../auth/schemas/auth.schema';
import { OrganizationRole } from '../../organization/enums';
import {
  organizationRoleEnum,
  organizations,
} from '../../organization/schemas/organization.schema';

export const memberships = pgTable(
  'memberships',
  {
    ...idColumn,
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }),
    role: organizationRoleEnum('role')
      .notNull()
      .default(OrganizationRole.VOLUNTEER),
    ...timestampColumns,
  },
  (table) => [
    index('idx_memberships_user_id').on(table.userId),
    index('idx_memberships_organization_id').on(table.organizationId),
    unique('uq_memberships_user_id_organization_id').on(
      table.userId,
      table.organizationId,
    ),
  ],
);

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));

export type MembershipEntity = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
