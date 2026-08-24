import { integer, pgEnum, snakeCase, text, unique } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { ReimbursementTypeKey } from '../enums';

export const reimbursementTypeKeyEnum = pgEnum(
  'reimbursement_type_key',
  enumValues(ReimbursementTypeKey),
);

export const reimbursementTypes = snakeCase.table(
  'reimbursement_types',
  {
    ...idColumn,
    key: reimbursementTypeKeyEnum('key')
      .$type<ReimbursementTypeKey>()
      .notNull(),
    legalReference: text('legal_reference').notNull(),
    yearlyLimitCents: integer('yearly_limit_cents').notNull(),
    platformDefaultRateCents: integer('platform_default_rate_cents').notNull(),
    ...timestampColumns,
  },
  (table) => [unique('uq_reimbursement_types_key').on(table.key)],
);

export type ReimbursementTypeEntity = typeof reimbursementTypes.$inferSelect;
export type ReimbursementTypeInsert = typeof reimbursementTypes.$inferInsert;
