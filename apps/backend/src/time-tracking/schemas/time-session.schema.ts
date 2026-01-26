import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { taskAssignments } from '../../task/schemas/task-assignment.schema';
import { TimeSessionStatus } from '../enums';
import { timeRecords } from './time-record.schema';

export const timeSessionStatusEnum = pgEnum(
  'time_session_status',
  TimeSessionStatus as Record<string, string>,
);

export const timeSessions = pgTable('time_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assignmentId: uuid('assignment_id').references(() => taskAssignments.id, {
    onDelete: 'restrict',
  }),
  status: timeSessionStatusEnum('status')
    .notNull()
    .default(TimeSessionStatus.PENDING),
  validatedBy: text('validated_by').references(() => users.id, {
    onDelete: 'restrict',
  }),
  validatedAt: timestamp('validated_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeSessionsRelations = relations(
  timeSessions,
  ({ one, many }) => ({
    assignment: one(taskAssignments, {
      fields: [timeSessions.assignmentId],
      references: [taskAssignments.id],
    }),
    validatedBy: one(users, {
      fields: [timeSessions.validatedBy],
      references: [users.id],
    }),
    records: many(timeRecords),
  }),
);

export type TimeSessionEntity = typeof timeSessions.$inferSelect;
export type TimeSessionInsert = typeof timeSessions.$inferInsert;
