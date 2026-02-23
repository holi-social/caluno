import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { volunteerSessions } from './volunteer-session.schema';

export const timeEntries = pgTable('time_entries', {
  ...idColumn,
  sessionId: uuid('session_id')
    .references(() => volunteerSessions.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at').notNull(),
  notes: text('notes'),
  ...timestampColumns,
});

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  session: one(volunteerSessions, {
    fields: [timeEntries.sessionId],
    references: [volunteerSessions.id],
  }),
}));

export type TimeEntryEntity = typeof timeEntries.$inferSelect;
export type TimeEntryInsert = typeof timeEntries.$inferInsert;
