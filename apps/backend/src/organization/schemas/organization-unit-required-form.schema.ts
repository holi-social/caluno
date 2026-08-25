import { integer, primaryKey, snakeCase, uuid } from 'drizzle-orm/pg-core';
import { idColumn } from '../../database/database-columns';
import { requirementForms } from '../../requirement-profile/schemas/requirement-form.schema';
import { organizationUnits } from './organization-unit.schema';

export const organizationUnitRequiredForms = snakeCase.table(
  'organization_unit_required_forms',
  {
    ...idColumn,
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, { onDelete: 'cascade' })
      .notNull(),
    formId: uuid('form_id')
      .references(() => requirementForms.id, { onDelete: 'restrict' })
      .notNull(),
    order: integer('order').notNull().default(0),
  },
  (table) => [
    primaryKey({
      name: 'pk_organization_unit_required_forms',
      columns: [table.organizationUnitId, table.formId],
    }),
  ],
);

export type OrganizationUnitRequiredFormEntity =
  typeof organizationUnitRequiredForms.$inferSelect;
export type OrganizationUnitRequiredFormInsert =
  typeof organizationUnitRequiredForms.$inferInsert;
