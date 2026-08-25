import {
  boolean,
  index,
  snakeCase,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';

export const roles = snakeCase.table(
  'roles',
  {
    ...idColumn,
    name: text('name').notNull(),
    description: text('description'),
    isInternal: boolean('is_internal').notNull().default(false),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_roles_name_organization_unit_id').on(
      table.name,
      table.organizationId,
    ),
    index('idx_roles_organization_id').on(table.organizationId),
  ],
);

export type RoleEntity = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
