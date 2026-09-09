import {
  index,
  integer,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { shifts } from './shift.schema';
import { shiftInstances } from './shift-instance.schema';

/**
 * One row per "shifts that need people" row actually shown in a Sunday
 * volunteer digest send — not the full eligible candidate pool before the
 * per-organisation 10-row cap. `position` is 1-based within its
 * organisation's own sub-list (the needs-volunteers section is grouped and
 * capped per organisation, since gap is only comparable within one org's
 * own minimum-setting convention).
 */
export const volunteerDigestShiftLogs = snakeCase.table(
  'volunteer_digest_shift_logs',
  {
    ...idColumn,
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    shiftId: uuid('shift_id')
      .references(() => shifts.id, { onDelete: 'cascade' })
      .notNull(),
    instanceId: uuid('instance_id')
      .references(() => shiftInstances.id, { onDelete: 'cascade' })
      .notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer('position').notNull(),
    sendDate: timestamp('send_date').notNull(),
    acceptedCount: integer('accepted_count').notNull(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_vdsl_user_id').on(table.userId),
    index('idx_vdsl_instance_id').on(table.instanceId),
    index('idx_vdsl_send_date').on(table.sendDate),
  ],
);

export type VolunteerDigestShiftLogEntity =
  typeof volunteerDigestShiftLogs.$inferSelect;
