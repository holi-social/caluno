import {
  boolean,
  index,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';

export const roles = pgTable(
  'roles',
  {
    ...idColumn,
    name: text('name').notNull(),
    description: text('description'),
    isInternal: boolean('is_internal').notNull().default(false),
    organizationUnitId: uuid('organization_unit_id').references(
      () => organizationUnits.id,
      { onDelete: 'restrict' },
    ),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_roles_name_organization_unit_id').on(
      table.name,
      table.organizationUnitId,
    ),
    index('idx_roles_organization_unit_id').on(table.organizationUnitId),
  ],
);

export type RoleEntity = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
