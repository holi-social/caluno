import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';

export const requirementProfiles = pgTable(
  'requirement_profiles',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    ...timestampColumns,
  },
  (table) => [
    index('idx_requirement_profiles_organization_id').on(table.organizationId),
  ],
);

export type RequirementProfileEntity = typeof requirementProfiles.$inferSelect;
export type RequirementProfileInsert = typeof requirementProfiles.$inferInsert;
