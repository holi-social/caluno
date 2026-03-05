import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { MembershipRequestStatus } from '../enums';

export const membershipRequestStatusEnum = pgEnum(
  'membership_request_status',
  MembershipRequestStatus as Record<string, string>,
);

export const membershipRequests = pgTable(
  'membership_requests',
  {
    ...idColumn,
    ...timestampColumns,
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
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
  },
  (table) => [
    index('idx_membership_requests_user_id').on(table.userId),
    index('idx_membership_requests_organization_id').on(table.organizationId),
    unique('uq_membership_requests_user_id_organization_id').on(
      table.userId,
      table.organizationId,
    ),
  ],
);

export type MembershipRequestEntity = typeof membershipRequests.$inferSelect;
export type MembershipRequestInsert = typeof membershipRequests.$inferInsert;
