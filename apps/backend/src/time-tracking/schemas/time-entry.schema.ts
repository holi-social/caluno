import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  snakeCase,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { reimbursementTypes } from '../../accounting/schemas/reimbursement-type.schema';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import type { ShiftInstanceEntity } from '../../shift/schemas/shift-instance.schema';
import { shiftInstances } from '../../shift/schemas/shift-instance.schema';

export const timeEntries = snakeCase.table(
  'time_entries',
  {
    ...idColumn,
    shiftInstanceId: uuid('shift_instance_id').references(
      () => shiftInstances.id,
      { onDelete: 'restrict' },
    ),
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, { onDelete: 'restrict' })
      .notNull(),
    volunteerId: text('volunteer_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    startedAt: timestamp('started_at').notNull(),
    endedAt: timestamp('ended_at'),
    notes: text('notes'),
    reimbursementTypeId: uuid('reimbursement_type_id').references(
      () => reimbursementTypes.id,
      { onDelete: 'restrict' },
    ),
    isPaid: boolean('is_paid').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex('uq_time_entries_open_per_instance_volunteer')
      .on(table.shiftInstanceId, table.volunteerId)
      .where(sql`${table.endedAt} IS NULL`),
    uniqueIndex('uq_time_entries_open_shiftless_per_org_volunteer')
      .on(table.organizationUnitId, table.volunteerId)
      .where(sql`${table.shiftInstanceId} IS NULL AND ${table.endedAt} IS NULL`),
    check(
      'chk_time_entries_paid_requires_reimbursement_type',
      sql`${table.isPaid} = false OR ${table.reimbursementTypeId} IS NOT NULL`,
    ),
  ],
);

export type TimeEntryEntity = typeof timeEntries.$inferSelect;

export type TimeEntryEntityWithRelations = TimeEntryEntity & {
  shiftInstance?: ShiftInstanceEntity | null;
};

export type TimeEntryInsert = typeof timeEntries.$inferInsert;
