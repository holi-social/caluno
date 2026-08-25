import { index, snakeCase, text, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from './organization.schema';

export const organizationUnitTypes = snakeCase.table(
  'organization_unit_types',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_organization_unit_types_organization_id_name').on(
      table.organizationId,
      table.name,
    ),
    index('idx_organization_unit_types_organization_id').on(
      table.organizationId,
    ),
    index('idx_organization_unit_types_name').on(table.name),
  ],
);

export type OrganizationUnitTypeEntity =
  typeof organizationUnitTypes.$inferSelect;
export type OrganizationUnitTypeInsert =
  typeof organizationUnitTypes.$inferInsert;
