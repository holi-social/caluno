import {
  index,
  jsonb,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { MembershipRequestStatus } from '../enums';

export type MembershipRequestMetadata = {
  intendedShiftInstanceIds?: string[];
  intendedShiftIds?: string[];
  intendedEventIds?: string[];
};

export const membershipRequestStatusEnum = pgEnum(
  'membership_request_status',
  MembershipRequestStatus as Record<string, string>,
);

export const membershipRequests = snakeCase.table(
  'membership_requests',
  {
    ...idColumn,
    ...timestampColumns,
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    reviewedById: text('reviewed_by_user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    reviewedAt: timestamp('reviewed_at'),
    rejectionReason: text('rejection_reason'),
    status: membershipRequestStatusEnum('status')
      .notNull()
      .default(MembershipRequestStatus.PENDING),
    metadata: jsonb('metadata').$type<MembershipRequestMetadata>(),
  },
  (table) => [
    index('idx_membership_requests_user_id').on(table.userId),
    index('idx_membership_requests_organization_unit_id').on(
      table.organizationUnitId,
    ),
    unique('uq_membership_requests_user_id_organization_unit_id').on(
      table.userId,
      table.organizationUnitId,
    ),
  ],
);

export type MembershipRequestEntity = typeof membershipRequests.$inferSelect;
export type MembershipRequestInsert = typeof membershipRequests.$inferInsert;
