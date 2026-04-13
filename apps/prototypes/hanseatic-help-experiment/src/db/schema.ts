import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const hanseaticHelpEntries = pgTable('hanseatic_help_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: text('action').notNull(),
  plannedDurationHours: integer('planned_duration_hours'),
  arrivalTime: text('arrival_time'),
  breakArrivalTime: text('break_arrival_time'),
  breakDepartureTime: text('break_departure_time'),
  name: text('name'),
  email: text('email'),
  gdprConsent: boolean('gdpr_consent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type HanseaticHelpEntryRow = typeof hanseaticHelpEntries.$inferSelect;
