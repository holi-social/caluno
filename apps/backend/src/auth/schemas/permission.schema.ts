import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const permissions = pgTable(
  'permissions',
  {
    ...idColumn,
    key: text('key').notNull().unique(),
    description: text('description'),
    ...timestampColumns,
  },
  (table) => [index('idx_permissions_key').on(table.key)],
);

export type PermissionEntity = typeof permissions.$inferSelect;
export type PermissionInsert = typeof permissions.$inferInsert;
