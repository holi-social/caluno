import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const roles = pgTable(
  'roles',
  {
    ...idColumn,
    name: text('name').notNull(),
    description: text('description'),
    isInternal: boolean('is_internal').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [index('idx_roles_name').on(table.name)],
);

export type RoleEntity = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
