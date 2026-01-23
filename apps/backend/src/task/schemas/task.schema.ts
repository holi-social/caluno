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
import { opportunities } from '../../opportunity/schemas/opportunity.schema';
import { TaskStatus } from '../models/task.model';
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
        opportunityId: uuid('opportunity_id').references(
            () => opportunities.id,
            {
                onDelete: 'restrict',
            },
        ),
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
        index('idx_tasks_opportunity_id').on(table.opportunityId),
        index('idx_tasks_status').on(table.status),
        index('idx_tasks_due_date').on(table.dueDate),
        index('idx_tasks_title').on(table.title),
        index('idx_tasks_created_by_id').on(table.createdById),
    ],
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    opportunity: one(opportunities, {
        fields: [tasks.opportunityId],
        references: [opportunities.id],
    }),
    createdBy: one(users, {
        fields: [tasks.createdById],
        references: [users.id],
    }),
    assignments: many(taskAssignments),
}));

export type TaskEntity = typeof tasks.$inferSelect;
export type TaskInsert = typeof tasks.$inferInsert;
