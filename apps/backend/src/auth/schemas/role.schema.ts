import { boolean, index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { organizations } from '../../organization/schemas/organization.schema';
import { sql } from 'drizzle-orm';
import { check } from 'drizzle-orm/pg-core';

export const roles = pgTable(
  'roles',
  {
    ...idColumn,
    name: text('name').notNull(),
    description: text('description'),
    isInternal: boolean('is_internal').notNull().default(false),
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, { onDelete: 'restrict' }),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'restrict' }),
    ...timestampColumns,
  },
  (table) => [
    check(
      'chk_roles_exactly_one_scope_fk',
      sql`(
        (${table.organizationId} IS NOT NULL AND ${table.organizationUnitId} IS NULL)
        OR
        (${table.organizationId} IS NULL AND ${table.organizationUnitId} IS NOT NULL)
      )`,
    ),
    unique('uq_roles_name_organization_unit_id').on(table.name, table.organizationUnitId),
    unique('uq_roles_name_organization_id').on(table.name, table.organizationId),
    index('idx_roles_organization_unit_id').on(table.organizationUnitId),
    index('idx_roles_organization_id').on(table.organizationId),
  ],
);

export type RoleEntity = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
