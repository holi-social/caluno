import { index, snakeCase, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { requirements } from './requirement.schema';
import { requirementProfiles } from './requirement-profile.schema';

export const requirementProfileRequirements = snakeCase.table(
  'requirement_profile_requirements',
  {
    ...idColumn,
    profileId: uuid('requirement_profile_id')
      .references(() => requirementProfiles.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    requirementId: uuid('requirement_id')
      .references(() => requirements.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_requirement_profile_requirements_profile_requirement').on(
      table.profileId,
      table.requirementId,
    ),
    index('idx_requirement_profile_requirements_profile_id').on(
      table.profileId,
    ),
    index('idx_requirement_profile_requirements_requirement_id').on(
      table.requirementId,
    ),
  ],
);

export type RequirementProfileRequirementEntity =
  typeof requirementProfileRequirements.$inferSelect;
