import {
  boolean,
  index,
  integer,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { reimbursementTypes } from '../../accounting/schemas/reimbursement-type.schema';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { events } from '../../event/schemas/event.schema';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { ShiftVisibility } from '../enums';

export const shiftVisibilityEnum = pgEnum(
  'shift_visibility',
  enumValues(ShiftVisibility),
);

export const shifts = snakeCase.table(
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
    imageUrl: text('image_url'),
    visibility: shiftVisibilityEnum('visibility')
      .$type<ShiftVisibility>()
      .notNull()
      .default(ShiftVisibility.ALL_MEMBERS),
    maxVolunteers: integer('max_volunteers'),
    minVolunteers: integer('min_volunteers'),
    joinRequiresApproval: boolean('join_requires_approval')
      .notNull()
      .default(false),
    eventId: uuid('event_id').references(() => events.id, {
      onDelete: 'set null',
    }),
    reimbursementTypeId: uuid('reimbursement_type_id').references(
      () => reimbursementTypes.id,
      { onDelete: 'restrict' },
    ),
    rrule: text('rrule'),
    originalStartsAt: timestamp('original_starts_at').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    index('idx_shifts_org_unit_id').on(table.organizationUnitId),
    index('idx_shifts_created_by_id').on(table.createdById),
    index('idx_shifts_event_id').on(table.eventId),
    index('idx_shifts_reimbursement_type_id').on(table.reimbursementTypeId),
    index('idx_shifts_slug').on(table.slug),
    index('idx_shifts_is_deleted').on(table.isDeleted),
  ],
);

export type ShiftEntity = typeof shifts.$inferSelect;
