import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { projects } from '../../project/schemas/project.schema';
import { TaskStatus } from '../enums';
import { taskAssignments } from './task-assignment.schema';

export const taskStatusEnum = pgEnum(
  'task_status',
  TaskStatus as Record<string, string>,
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
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
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_tasks_project_id').on(table.projectId),
    index('idx_tasks_status').on(table.status),
    index('idx_tasks_due_date').on(table.dueDate),
    index('idx_tasks_title').on(table.title),
    index('idx_tasks_created_by_id').on(table.createdById),
  ],
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
  }),
  assignments: many(taskAssignments),
}));

export type TaskEntity = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
