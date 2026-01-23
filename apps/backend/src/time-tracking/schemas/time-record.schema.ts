import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timeSessions } from './time-session.schema';

export const timeRecords = pgTable('time_records', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
        .references(() => timeSessions.id, {
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

export const timeRecordsRelations = relations(timeRecords, ({ one }) => ({
    session: one(timeSessions, {
        fields: [timeRecords.sessionId],
        references: [timeSessions.id],
    }),
}));

export type TimeRecordEntity = typeof timeRecords.$inferSelect;
export type TimeRecordInsert = typeof timeRecords.$inferInsert;
