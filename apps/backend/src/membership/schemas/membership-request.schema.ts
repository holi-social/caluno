import {
  index,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
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
    email: text('email').notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    status: membershipRequestStatusEnum('status')
      .notNull()
      .default(MembershipRequestStatus.PENDING),
    ...timestampColumns,
  },
  (table) => [
    index('idx_membership_requests_email').on(table.email),
    index('idx_memberships_requests_organization_id').on(table.organizationId),
    unique('uq_memberships_requests_email_organization_id').on(
      table.email,
      table.organizationId,
    ),
  ],
);

export type MembershipRequestEntity = typeof membershipRequests.$inferSelect;
export type MembershipRequestInsert = typeof membershipRequests.$inferInsert;
