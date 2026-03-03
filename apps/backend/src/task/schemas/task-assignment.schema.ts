import { index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { tasks } from './task.schema';

export const taskAssignments = pgTable(
  'task_assignments',
  {
    ...idColumn,
    taskId: uuid('task_id').references(() => tasks.id, {
      onDelete: 'restrict',
    }),
    assignedToId: text('assigned_to_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    assignedById: text('assigned_by_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    ...timestampColumns,
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

export type TaskAssignmentEntity = typeof taskAssignments.$inferSelect;
export type TaskAssignmentInsert = typeof taskAssignments.$inferInsert;
