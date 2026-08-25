import { index, jsonb, snakeCase, text } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const userProfiles = snakeCase.table(
  'user_profiles',
  {
    ...idColumn,
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
    ...timestampColumns,
  },
  (table) => [index('idx_user_profiles_user_id').on(table.userId)],
);

export type UserProfileEntity = typeof userProfiles.$inferSelect;
export type UserProfileInsert = typeof userProfiles.$inferInsert;
