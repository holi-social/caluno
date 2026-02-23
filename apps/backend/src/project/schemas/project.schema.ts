import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { users } from '../../auth/schemas/auth.schema';
import { organizations } from '../../organization/schemas/organization.schema';
import { tasks } from '../../task/schemas/task.schema';
import { ProjectStatus } from '../enums';

export const projectStatusEnum = pgEnum(
  'project_status',
  ProjectStatus as Record<string, string>,
);

export const projects = pgTable(
  'projects',
  {
    ...idColumn,
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    location: text('location').notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    createdById: text('created_by_id')
      .references(() => users.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    status: projectStatusEnum('status').notNull().default(ProjectStatus.DRAFT),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at').notNull(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_projects_organization_id').on(table.organizationId),
    index('idx_projects_status').on(table.status),
    index('idx_projects_title').on(table.title),
    index('idx_projects_starts_at').on(table.startsAt),
    index('idx_projects_ends_at').on(table.endsAt),
    index('idx_projects_created_by_id').on(table.createdById),
  ],
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [projects.createdById],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export type ProjectEntity = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
