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
import { memberships } from '../../membership/schemas/membership.schema';
import { membershipRequests } from '../../membership/schemas/membership-request.schema';
import { RequirementProfileSubmissionStatus } from '../enums';
import { requirementProfiles } from './requirement-profile.schema';

export const requirementProfileSubmissionStatusEnum = pgEnum(
  'requirement_profile_submission_status',
  RequirementProfileSubmissionStatus as Record<string, string>,
);

export const requirementProfileSubmissions = pgTable(
  'requirement_profile_submissions',
  {
    ...idColumn,
    profileId: uuid('requirement_profile_id')
      .references(() => requirementProfiles.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    membershipId: uuid('membership_id').references(() => memberships.id, {
      onDelete: 'set null',
    }),
    requestId: uuid('membership_request_id').references(
      () => membershipRequests.id,
      {
        onDelete: 'set null',
      },
    ),
    status: requirementProfileSubmissionStatusEnum('status')
      .notNull()
      .default(RequirementProfileSubmissionStatus.DRAFT),
    submittedAt: timestamp('submitted_at'),
    reviewedAt: timestamp('reviewed_at'),
    reviewedById: text('reviewed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    ...timestampColumns,
  },
  (table) => [
    index('idx_requirement_profile_submissions_profile_id').on(table.profileId),
    index('idx_requirement_profile_submissions_membership_id').on(
      table.membershipId,
    ),
    index('idx_requirement_profile_submissions_membership_request_id').on(
      table.requestId,
    ),
    index('idx_requirement_profile_submissions_reviewed_by_id').on(
      table.reviewedById,
    ),
  ],
);

export type RequirementProfileSubmissionEntity =
  typeof requirementProfileSubmissions.$inferSelect;
export type RequirementProfileSubmissionInsert =
  typeof requirementProfileSubmissions.$inferInsert;
