import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { shifts } from '../../shift/schemas/shift.schema';
import { taskAssignments } from '../../task/schemas/task-assignment.schema';
import { VolunteerSessionStatus } from '../enums';
import { timeEntries } from './time-entry.schema';

export const volunteerSessionStatusEnum = pgEnum(
  'volunteer_session_status',
  VolunteerSessionStatus as Record<string, string>,
);

export const volunteerSessions = pgTable('volunteer_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').references(() => taskAssignments.id, {
    onDelete: 'restrict',
  }),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const volunteerSessionsRelations = relations(
  volunteerSessions,
  ({ one, many }) => ({
    assignment: one(taskAssignments, {
      fields: [volunteerSessions.assignmentId],
      references: [taskAssignments.id],
    }),
    shift: one(shifts, {
      fields: [volunteerSessions.shiftId],
      references: [shifts.id],
    }),
    validatedBy: one(users, {
      fields: [volunteerSessions.validatedBy],
      references: [users.id],
    }),
    entries: many(timeEntries),
  }),
);

export type VolunteerSessionEntity = typeof volunteerSessions.$inferSelect;
export type VolunteerSessionInsert = typeof volunteerSessions.$inferInsert;
