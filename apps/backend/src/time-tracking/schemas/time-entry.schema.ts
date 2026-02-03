import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { volunteerSessions } from './volunteer-session.schema';

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .references(() => volunteerSessions.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  session: one(volunteerSessions, {
    fields: [timeEntries.sessionId],
    references: [volunteerSessions.id],
  }),
}));

export type TimeEntryEntity = typeof timeEntries.$inferSelect;
export type TimeEntryInsert = typeof timeEntries.$inferInsert;
