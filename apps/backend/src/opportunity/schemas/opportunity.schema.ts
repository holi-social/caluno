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
import { tasks } from '../../task/schemas/task.schema';
import { OpportunityStatus } from '../enums';

export const opportunityStatusEnum = pgEnum(
  'opportunity_status',
  OpportunityStatus as Record<string, string>,
);

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
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
    status: opportunityStatusEnum('status')
      .notNull()
      .default(OpportunityStatus.DRAFT),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_opportunities_organization_id').on(table.organizationId),
    index('idx_opportunities_status').on(table.status),
    index('idx_opportunities_title').on(table.title),
    index('idx_opportunities_starts_at').on(table.startsAt),
    index('idx_opportunities_ends_at').on(table.endsAt),
    index('idx_opportunities_created_by_id').on(table.createdById),
  ],
);

export const opportunitiesRelations = relations(
  opportunities,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [opportunities.organizationId],
      references: [organizations.id],
    }),
    createdBy: one(users, {
      fields: [opportunities.createdById],
      references: [users.id],
    }),
    tasks: many(tasks),
  }),
);

export type OpportunityEntity = typeof opportunities.$inferSelect;
export type OpportunityInsert = typeof opportunities.$inferInsert;
