import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const timeEntries = pgTable('time_entries', {
  ...idColumn,
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at').notNull(),
  notes: text('notes'),
  ...timestampColumns,
});

export type TimeEntryEntity = typeof timeEntries.$inferSelect;
export type TimeEntryInsert = typeof timeEntries.$inferInsert;
