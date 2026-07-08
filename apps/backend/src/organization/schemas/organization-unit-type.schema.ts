import { index, snakeCase, text } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const organizationUnitTypes = snakeCase.table(
  'organization_unit_types',
  {
    ...idColumn,
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    ...timestampColumns,
  },
  (table) => [index('idx_organization_unit_types_name').on(table.name)],
);

export type OrganizationUnitTypeEntity =
  typeof organizationUnitTypes.$inferSelect;
export type OrganizationUnitTypeInsert =
  typeof organizationUnitTypes.$inferInsert;
