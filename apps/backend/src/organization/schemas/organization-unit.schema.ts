import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from './organization.schema';
import { organizationUnitTypes } from './organization-unit-type.schema';

export const organizationUnits = pgTable(
  'organization_units',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    parentId: uuid('parent_id').references((): any => organizationUnits.id, {
      onDelete: 'cascade',
    }),
    typeId: uuid('type_id')
      .references(() => organizationUnitTypes.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    isRoot: boolean('is_root').notNull().default(false),
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
    unique('uq_organization_units_organization_id_slug').on(
      table.organizationId,
      table.slug,
    ),
    unique('uq_organization_units_organization_id_id').on(
      table.organizationId,
      table.id,
    ),
    uniqueIndex('uq_organization_units_organization_id_is_root_true')
      .on(table.organizationId)
      .where(sql`${table.isRoot} = true`),
    check(
      'chk_organization_units_root_parent_consistency',
      sql`(
        (${table.isRoot} = true AND ${table.parentId} IS NULL)
        OR
        (${table.isRoot} = false AND ${table.parentId} IS NOT NULL)
      )`,
    ),
    check(
      'chk_organization_units_not_self_parent',
      sql`${table.parentId} IS NULL OR ${table.parentId} <> ${table.id}`,
    ),
    foreignKey({
      name: 'fk_organization_units_parent_same_organization',
      columns: [table.organizationId, table.parentId],
      foreignColumns: [table.organizationId, table.id],
    }).onDelete('cascade'),
    index('idx_organization_units_parent_id').on(table.parentId),
    index('idx_organization_units_type_id').on(table.typeId),
    index('idx_organization_units_name').on(table.name),
    index('idx_organization_units_deleted_at').on(table.deletedAt),
  ],
);

export type OrganizationUnitEntity = typeof organizationUnits.$inferSelect;
export type OrganizationUnitInsert = typeof organizationUnits.$inferInsert;
