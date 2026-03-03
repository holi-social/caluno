import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { projects } from '../../project/schemas/project.schema';
import { TaskStatus } from '../enums';

export const taskStatusEnum = pgEnum(
  'task_status',
  TaskStatus as Record<string, string>,
);

export const tasks = pgTable(
  'tasks',
  {
    ...idColumn,
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'restrict',
    }),
    createdById: text('created_by_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    status: taskStatusEnum('status').notNull().default(TaskStatus.TODO),
    dueDate: timestamp('due_date').notNull(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_tasks_project_id').on(table.projectId),
    index('idx_tasks_status').on(table.status),
    index('idx_tasks_due_date').on(table.dueDate),
    index('idx_tasks_title').on(table.title),
    index('idx_tasks_created_by_id').on(table.createdById),
  ],
);

export type TaskEntity = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
