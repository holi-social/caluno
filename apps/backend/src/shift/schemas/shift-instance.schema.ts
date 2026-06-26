import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { shifts } from './shift.schema';

export const shiftInstances = pgTable(
  'shift_instances',
  {
    ...idColumn,
    masterId: uuid('master_id')
      .references(() => shifts.id, { onDelete: 'cascade' })
      .notNull(),
    actualStartsAt: timestamp('actual_starts_at').notNull(),
    actualEndsAt: timestamp('actual_ends_at').notNull(),
    overrideTitle: text('override_title'),
    overrideInstructions: text('override_instructions'),
    overrideLocation: text('override_location'),
    overrideMaxVolunteers: integer('override_max_volunteers'),
    isException: boolean('is_exception').notNull().default(false),
    isCancelled: boolean('is_cancelled').notNull().default(false),
    occurrenceIndex: integer('occurrence_index').notNull(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_si_master_id').on(table.masterId),
    index('idx_si_actual_starts_at').on(table.actualStartsAt),
    index('idx_si_actual_ends_at').on(table.actualEndsAt),
    index('idx_si_active_range').on(table.actualStartsAt, table.actualEndsAt),
    index('idx_si_is_exception').on(table.isException),
    index('idx_si_is_cancelled').on(table.isCancelled),
  ],
);

export type ShiftInstanceEntity = typeof shiftInstances.$inferSelect;
