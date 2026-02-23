import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { memberships } from '../../membership/schemas/membership.schema';
import { projects } from '../../project/schemas/project.schema';
import { OrganizationRole } from '../enums';

export const organizationRoleEnum = pgEnum(
  'organization_role',
  OrganizationRole as Record<string, string>,
);

export const organizations = pgTable(
  'organizations',
  {
    ...idColumn,
    parentId: uuid('parent_id').references((): any => organizations.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logoUrl: text('logo_url'),
    websiteUrl: text('website_url'),
    email: text('email'),
    phone: text('phone'),
    description: text('description'),
    address: text('address'),
    deletedAt: timestamp('deleted_at'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    ...timestampColumns,
  },
  (table) => [
    index('idx_organizations_parent_id').on(table.parentId),
    index('idx_organizations_owner_id').on(table.ownerId),
    index('idx_organizations_name').on(table.name),
    index('idx_organizations_deleted_at').on(table.deletedAt),
  ],
);

export const organizationRelations = relations(
  organizations,
  ({ one, many }) => ({
    parent: one(organizations, {
      fields: [organizations.parentId],
      references: [organizations.id],
      relationName: 'parentChild',
    }),
    children: many(organizations, {
      relationName: 'parentChild',
    }),
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
    }),
    projects: many(projects),
    memberships: many(memberships),
  }),
);

export type OrganizationEntity = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;
