import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import type { ShiftInstanceEntity } from '../../shift/schemas/shift-instance.schema';
import { shiftInstances } from '../../shift/schemas/shift-instance.schema';

export const timeEntries = pgTable('time_entries', {
  ...idColumn,
  shiftInstanceId: uuid('shift_instance_id')
    .references(() => shiftInstances.id, {
      onDelete: 'restrict',
    })
    .notNull(),
  volunteerId: text('volunteer_id')
    .references(() => users.id, {
      onDelete: 'restrict',
    })
    .notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  notes: text('notes'),
  ...timestampColumns,
});

export type TimeEntryEntity = typeof timeEntries.$inferSelect;

export type TimeEntryEntityWithRelations = TimeEntryEntity & {
  shiftInstance?: ShiftInstanceEntity | null;
};

export type TimeEntryInsert = typeof timeEntries.$inferInsert;
