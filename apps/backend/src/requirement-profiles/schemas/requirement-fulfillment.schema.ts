import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { RequirementFulfillmentStatus } from '../enums';
import { documents } from './document.schema';
import { organizationUserProfiles } from './organization-user-profile.schema';
import { requirements } from './requirement.schema';
import { requirementProfileSubmissions } from './requirement-profile-submission.schema';

export const requirementFulfillmentStatusEnum = pgEnum(
  'requirement_fulfillment_status',
  RequirementFulfillmentStatus as Record<string, string>,
);

export const requirementFulfillments = pgTable(
  'requirement_fulfillments',
  {
    ...idColumn,
    submissionId: uuid('requirement_profile_submission_id')
      .references(() => requirementProfileSubmissions.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    requirementId: uuid('requirement_id')
      .references(() => requirements.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    profileId: uuid('organization_user_profile_id').references(
      () => organizationUserProfiles.id,
      {
        onDelete: 'restrict',
      },
    ),
    documentId: uuid('document_id').references(() => documents.id, {
      onDelete: 'restrict',
    }),
    value: jsonb('value'),
    status: requirementFulfillmentStatusEnum('status')
      .notNull()
      .default(RequirementFulfillmentStatus.DRAFT),
    submittedAt: timestamp('submitted_at'),
    reviewedAt: timestamp('reviewed_at'),
    reviewedById: text('reviewed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    ...timestampColumns,
  },
  (table) => [
    index('idx_requirement_fulfillments_submission_id').on(table.submissionId),
    index('idx_requirement_fulfillments_requirement_id').on(
      table.requirementId,
    ),
    index('idx_requirement_fulfillments_profile_id').on(table.profileId),
    index('idx_requirement_fulfillments_document_id').on(table.documentId),
    index('idx_requirement_fulfillments_reviewed_by_id').on(table.reviewedById),
  ],
);

export type RequirementFulfillmentEntity =
  typeof requirementFulfillments.$inferSelect;
export type RequirementFulfillmentInsert =
  typeof requirementFulfillments.$inferInsert;
