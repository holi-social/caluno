import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { tasks } from './task.schema';

export const taskAssignments = pgTable(
  'task_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id').references(() => tasks.id, {
      onDelete: 'restrict',
    }),
    assignedToId: text('assigned_to_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    assignedById: text('assigned_by_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_task_assignments_task_id').on(table.taskId),
    index('idx_task_assignments_assigned_to_id').on(table.assignedToId),
    index('idx_task_assignments_assigned_by_id').on(table.assignedById),
    unique('uq_task_assignments_task_id_assigned_to_id').on(
      table.taskId,
      table.assignedToId,
    ),
  ],
);

export const taskAssignmentsRelations = relations(
  taskAssignments,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskAssignments.taskId],
      references: [tasks.id],
    }),

    assignedTo: one(users, {
      fields: [taskAssignments.assignedToId],
      references: [users.id],
    }),

    assignedBy: one(users, {
      fields: [taskAssignments.assignedById],
      references: [users.id],
    }),
  }),
);

export type TaskAssignmentEntity = typeof taskAssignments.$inferSelect;
export type TaskAssignmentInsert = typeof taskAssignments.$inferInsert;
