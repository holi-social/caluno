import {
  integer,
  snakeCase,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';
import { reimbursementTypes } from './reimbursement-type.schema';

export const reimbursementManualBaselines = snakeCase.table(
  'reimbursement_manual_baselines',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    volunteerId: text('volunteer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    reimbursementTypeId: uuid('reimbursement_type_id')
      .references(() => reimbursementTypes.id, { onDelete: 'restrict' })
      .notNull(),
    year: integer('year').notNull(),
    amountCents: integer('amount_cents').notNull(),
    updatedByUserId: text('updated_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex('uq_reimbursement_manual_baselines_volunteer_type_year').on(
      table.volunteerId,
      table.reimbursementTypeId,
      table.year,
    ),
  ],
);

export type ManualBaselineEntity =
  typeof reimbursementManualBaselines.$inferSelect;
export type ManualBaselineInsert =
  typeof reimbursementManualBaselines.$inferInsert;
