import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { ShiftVisibility } from '../enums';

export const shiftVisibilityEnum = pgEnum(
  'shift_visibility',
  ShiftVisibility as Record<string, string>,
);

export const shifts = pgTable(
  'shifts',
  {
    ...idColumn,
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    instructions: text('instructions'),
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, { onDelete: 'cascade' })
      .notNull(),
    createdById: text('created_by_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    location: text('location'),
    visibility: shiftVisibilityEnum('visibility')
      .notNull()
      .default(ShiftVisibility.ALL_MEMBERS),
    maxVolunteers: integer('max_volunteers'),
    minVolunteers: integer('min_volunteers'),
    rrule: text('rrule'),
    originalStartsAt: timestamp('original_starts_at').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    index('idx_shifts_org_unit_id').on(table.organizationUnitId),
    index('idx_shifts_created_by_id').on(table.createdById),
    index('idx_shifts_slug').on(table.slug),
    index('idx_shifts_is_deleted').on(table.isDeleted),
  ],
);

export type ShiftEntity = typeof shifts.$inferSelect;
