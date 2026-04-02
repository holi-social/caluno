import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { shifts } from './shift.schema';

export const shiftRecurrenceRules = pgTable(
  'shift_recurrence_rules',
  {
    ...idColumn,
    shiftId: uuid('shift_id')
      .references(() => shifts.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    daysOfWeek: text('days_of_week').array().notNull(),
    endsAt: timestamp('ends_at'),
    ...timestampColumns,
  },
  (table) => [
    index('idx_shift_recurrence_rules_shift_id').on(table.shiftId),
    unique('uq_shift_recurrence_rules_shift_id').on(table.shiftId),
  ],
);

export type ShiftRecurrenceRuleEntity =
  typeof shiftRecurrenceRules.$inferSelect;
