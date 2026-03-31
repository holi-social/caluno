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
import { ShiftVisibility } from '../enums';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';

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
      .references(() => organizationUnits.id, {
        onDelete: 'cascade',
      })
      .notNull(),
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
    ...timestampColumns,
  },
  (table) => [
    index('idx_shifts_organization_unit_id').on(table.organizationUnitId),
    index('idx_shifts_created_by_id').on(table.createdById),
    index('idx_shifts_starts_at').on(table.startsAt),
    index('idx_shifts_ends_at').on(table.endsAt),
  ],
);

export type ShiftEntity = typeof shifts.$inferSelect;
