import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';

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
    ...timestampColumns,
  },
  (table) => [
    index('idx_organizations_parent_id').on(table.parentId),
    index('idx_organizations_name').on(table.name),
    index('idx_organizations_deleted_at').on(table.deletedAt),
  ],
);

export type OrganizationEntity = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;
