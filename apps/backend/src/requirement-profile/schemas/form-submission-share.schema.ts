import { index, snakeCase, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { formSubmissions } from './form-submission.schema';

export const formSubmissionShares = snakeCase.table(
  'form_submission_shares',
  {
    ...idColumn,
    submissionId: uuid('submission_id')
      .references(() => formSubmissions.id, { onDelete: 'cascade' })
      .notNull(),
    organizationUnitId: uuid('organization_unit_id')
      .references(() => organizationUnits.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_form_submission_shares_submission_unit').on(
      table.submissionId,
      table.organizationUnitId,
    ),
    index('idx_form_submission_shares_organization_unit_id').on(
      table.organizationUnitId,
    ),
  ],
);

export type FormSubmissionShareEntity =
  typeof formSubmissionShares.$inferSelect;
export type FormSubmissionShareInsert =
  typeof formSubmissionShares.$inferInsert;
