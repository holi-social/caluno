import {
  index,
  jsonb,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { RequirementFulfillmentStatus } from '../enums';
import { organizationUserProfiles } from './organization-user-profile.schema';
import { requirements, requirementTypeEnum } from './requirement.schema';
import { requirementProfileSubmissions } from './requirement-profile-submission.schema';

export const requirementFulfillmentStatusEnum = pgEnum(
  'requirement_fulfillment_status',
  enumValues(RequirementFulfillmentStatus),
);

export const requirementFulfillments = snakeCase.table(
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
    organizationUserProfileId: uuid('organization_user_profile_id').references(
      () => organizationUserProfiles.id,
      {
        onDelete: 'restrict',
      },
    ),
    type: requirementTypeEnum('type').notNull(),
    value: jsonb('value'),
    status: requirementFulfillmentStatusEnum('status')
      .$type<RequirementFulfillmentStatus>()
      .notNull()
      .default(RequirementFulfillmentStatus.DRAFT),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
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
    index('idx_requirement_fulfillments_profile_id').on(
      table.organizationUserProfileId,
    ),
    index('idx_requirement_fulfillments_reviewed_by_id').on(table.reviewedById),
  ],
);

export type RequirementFulfillmentEntity =
  typeof requirementFulfillments.$inferSelect;
export type RequirementFulfillmentInsert =
  typeof requirementFulfillments.$inferInsert;
