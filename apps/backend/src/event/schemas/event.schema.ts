import {
  boolean,
  index,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';

export const events = snakeCase.table(
  'events',
  {
    ...idColumn,
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    location: text('location'),
    logoUrl: text('logo_url'),
    coverUrl: text('cover_url'),
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, { onDelete: 'cascade' })
      .notNull(),
    createdById: text('created_by_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at').notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    index('idx_events_org_unit_id').on(table.organizationUnitId),
    index('idx_events_created_by_id').on(table.createdById),
    index('idx_events_slug').on(table.slug),
    index('idx_events_is_deleted').on(table.isDeleted),
  ],
);

export type EventEntity = typeof events.$inferSelect;
