import { integer, snakeCase, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { reimbursementTypes } from './reimbursement-type.schema';

export const reimbursementRates = snakeCase.table(
  'reimbursement_rates',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    // Null means this row is the organization-wide default rate; set means
    // it's a unit-level override. Never both for the same slot — mirrors
    // document_templates' organizationUnitId pattern.
    organizationUnitId: uuid('organization_unit_id').references(
      () => organizationUnits.id,
      { onDelete: 'cascade' },
    ),
    reimbursementTypeId: uuid('reimbursement_type_id')
      .references(() => reimbursementTypes.id, { onDelete: 'restrict' })
      .notNull(),
    hourlyRateCents: integer('hourly_rate_cents').notNull(),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex('uq_reimbursement_rates_org_default')
      .on(table.organizationId, table.reimbursementTypeId)
      .where(sql`${table.organizationUnitId} IS NULL`),
    uniqueIndex('uq_reimbursement_rates_unit_override')
      .on(table.organizationUnitId, table.reimbursementTypeId)
      .where(sql`${table.organizationUnitId} IS NOT NULL`),
  ],
);

export type ReimbursementRateEntity = typeof reimbursementRates.$inferSelect;
export type ReimbursementRateInsert = typeof reimbursementRates.$inferInsert;
