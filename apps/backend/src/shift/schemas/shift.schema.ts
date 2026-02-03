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
import { organizations } from '../../organization/schemas/organization.schema';
import { projects } from '../../project/schemas/project.schema';
import { shiftAssignments } from './shift-assignment.schema';
import { ShiftVisibility } from '../enums';

export const shiftVisibilityEnum = pgEnum(
  'shift_visibility',
  ShiftVisibility as Record<string, string>,
);

export const shifts = pgTable(
  'shifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    instructions: text('instructions').notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'restrict',
    }),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at').notNull(),
    createdById: text('created_by_id')
      .references(() => users.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    location: text('location'),
    visibility: shiftVisibilityEnum('visibility')
      .notNull()
      .default(ShiftVisibility.ALL_MEMBERS),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_shifts_organization_id').on(table.organizationId),
    index('idx_shifts_project_id').on(table.projectId),
    index('idx_shifts_created_by_id').on(table.createdById),
    index('idx_shifts_starts_at').on(table.startsAt),
    index('idx_shifts_ends_at').on(table.endsAt),
  ],
);

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [shifts.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [shifts.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [shifts.createdById],
    references: [users.id],
  }),
  assignments: many(shiftAssignments),
}));

export type ShiftEntity = typeof shifts.$inferSelect;
