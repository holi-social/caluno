import { index, jsonb, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';

export const requirementForms = pgTable(
  'requirement_forms',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    organizationUnitId: uuid('organization_unit_id').references(
      () => organizationUnits.id,
      { onDelete: 'cascade' },
    ),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    settings: jsonb('settings')
      .$type<{
        submitButtonLabel?: string;
        successTitle?: string;
        successMessage?: string;
        allowEmbed?: boolean;
      }>()
      .notNull()
      .default({}),
    shareToken: text('share_token').notNull().unique(),
    createdBy: text('created_by')
      .references(() => users.id)
      .notNull(),
    updatedBy: text('updated_by')
      .references(() => users.id)
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_requirement_forms_organization_unit_id_name').on(
      table.organizationUnitId,
      table.name,
    ),
    index('idx_requirement_forms_organization_id').on(table.organizationId),
    index('idx_requirement_forms_organization_unit_id').on(
      table.organizationUnitId,
    ),
    index('idx_requirement_forms_share_token').on(table.shareToken),
  ],
);

export type RequirementFormEntity = typeof requirementForms.$inferSelect;
export type RequirementFormInsert = typeof requirementForms.$inferInsert;
