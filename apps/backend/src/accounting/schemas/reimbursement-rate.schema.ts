import { integer, snakeCase, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { reimbursementTypes } from './reimbursement-type.schema';

export const reimbursementRates = snakeCase.table(
  'reimbursement_rates',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    reimbursementTypeId: uuid('reimbursement_type_id')
      .references(() => reimbursementTypes.id, { onDelete: 'restrict' })
      .notNull(),
    hourlyRateCents: integer('hourly_rate_cents').notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_reimbursement_rates_organization_id_reimbursement_type_id').on(
      table.organizationId,
      table.reimbursementTypeId,
    ),
  ],
);

export type ReimbursementRateEntity = typeof reimbursementRates.$inferSelect;
export type ReimbursementRateInsert = typeof reimbursementRates.$inferInsert;
