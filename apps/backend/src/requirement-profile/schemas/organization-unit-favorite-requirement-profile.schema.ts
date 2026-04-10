import { foreignKey, index, pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { requirementProfiles } from './requirement-profile.schema';

export const organizationUnitFavoriteRequirementProfiles = pgTable(
  'organization_unit_favorite_requirement_profiles',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    requirementProfileId: uuid('requirement_profile_id')
      .references(() => requirementProfiles.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique(
      'uq_org_unit_favorite_requirement_profiles_org_unit_profile',
    ).on(table.organizationUnitId, table.requirementProfileId),
    foreignKey({
      name: 'fk_org_unit_favorites_org_unit_same_organization',
      columns: [table.organizationId, table.organizationUnitId],
      foreignColumns: [organizationUnits.organizationId, organizationUnits.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'fk_org_unit_favorites_profile_same_organization',
      columns: [table.organizationId, table.requirementProfileId],
      foreignColumns: [requirementProfiles.organizationId, requirementProfiles.id],
    }).onDelete('cascade'),
    index('idx_org_unit_favorite_requirement_profiles_organization_id').on(
      table.organizationId,
    ),
    index('idx_org_unit_favorite_requirement_profiles_org_unit_id').on(
      table.organizationUnitId,
    ),
    index('idx_org_unit_favorite_requirement_profiles_profile_id').on(
      table.requirementProfileId,
    ),
  ],
);

export type OrganizationUnitFavoriteRequirementProfileEntity =
  typeof organizationUnitFavoriteRequirementProfiles.$inferSelect;
export type OrganizationUnitFavoriteRequirementProfileInsert =
  typeof organizationUnitFavoriteRequirementProfiles.$inferInsert;
