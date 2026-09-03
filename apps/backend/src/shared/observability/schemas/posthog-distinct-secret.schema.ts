import { date, snakeCase, text } from 'drizzle-orm/pg-core';
import { timestampColumns } from '../../../database/database-columns';

export const POSTHOG_DISTINCT_SECRET_SLOT = 'current';

export const posthogDistinctSecrets = snakeCase.table(
  'posthog_distinct_secrets',
  {
    slot: text('slot').primaryKey(),
    secret: text('secret').notNull(),
    validForDate: date('valid_for_date', { mode: 'string' }).notNull(),
    ...timestampColumns,
  },
);

export type PostHogDistinctSecretEntity =
  typeof posthogDistinctSecrets.$inferSelect;
export type PostHogDistinctSecretInsert =
  typeof posthogDistinctSecrets.$inferInsert;
