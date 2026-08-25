import {
  boolean,
  index,
  snakeCase,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const organizations = snakeCase.table(
  'organizations',
  {
    ...idColumn,
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logoUrl: text('logo_url'),
    websiteUrl: text('website_url'),
    contactEmail: text('contact_email'),
    phone: text('phone'),
    description: text('description'),
    address: text('address'),
    accountingEnabled: boolean('accounting_enabled').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
    ...timestampColumns,
  },
  (table) => [
    index('idx_organizations_name').on(table.name),
    index('idx_organizations_deleted_at').on(table.deletedAt),
  ],
);

export type OrganizationEntity = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;
