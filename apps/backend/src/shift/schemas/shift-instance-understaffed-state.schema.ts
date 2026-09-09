import { snakeCase, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestampColumns } from '../../database/database-columns';
import { shiftInstances } from './shift-instance.schema';

/**
 * One mutable row per instance, upserted every scheduler tick. `callOutFiredAt`
 * is cleared whenever the instance is observed back at/above minimum — that's
 * the re-arm mechanism letting the 48h call-out fire again on a later crossing.
 * `reminderFiredAt` is set once and never cleared: the 24h reminder fires at
 * most once for the whole 24h-to-start window, even if staffing flaps.
 */
export const shiftInstanceUnderstaffedStates = snakeCase.table(
  'shift_instance_understaffed_states',
  {
    instanceId: uuid('instance_id')
      .primaryKey()
      .references(() => shiftInstances.id, { onDelete: 'cascade' }),
    lastCheckedAt: timestamp('last_checked_at'),
    callOutFiredAt: timestamp('call_out_fired_at'),
    reminderFiredAt: timestamp('reminder_fired_at'),
    ...timestampColumns,
  },
);

export type ShiftInstanceUnderstaffedStateEntity =
  typeof shiftInstanceUnderstaffedStates.$inferSelect;
