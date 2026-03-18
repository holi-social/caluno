import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { shifts } from '../../shift/schemas/shift.schema';
import { VolunteerSessionStatus } from '../enums';

export const volunteerSessionStatusEnum = pgEnum(
  'volunteer_session_status',
  VolunteerSessionStatus as Record<string, string>,
);

export const volunteerSessions = pgTable('volunteer_sessions', {
  ...idColumn,
  shiftId: uuid('shift_id').references(() => shifts.id, {
    onDelete: 'restrict',
  }),
  status: volunteerSessionStatusEnum('status')
    .notNull()
    .default(VolunteerSessionStatus.PENDING),
  validatedBy: text('validated_by').references(() => users.id, {
    onDelete: 'restrict',
  }),
  validatedAt: timestamp('validated_at'),
  rejectionReason: text('rejection_reason'),
  ...timestampColumns,
});

export type VolunteerSessionEntity = typeof volunteerSessions.$inferSelect;
export type VolunteerSessionInsert = typeof volunteerSessions.$inferInsert;
