import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { OrganizationRole } from '../../organization/models/organization.model';
import {
  organizationRoleEnum,
  organizations,
} from '../../organization/schemas/organization.schema';

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }),
    role: organizationRoleEnum('role')
      .notNull()
      .default(OrganizationRole.VOLUNTEER),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
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
