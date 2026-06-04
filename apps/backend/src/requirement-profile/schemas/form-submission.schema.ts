import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { memberships } from '../../membership/schemas/membership.schema';
import { FormSubmissionStatus } from '../enums';
import { requirementForms } from './requirement-form.schema';

export const formSubmissionStatusEnum = pgEnum(
  'form_submission_status',
  FormSubmissionStatus as Record<string, string>,
);

export const formSubmissions = pgTable(
  'form_submissions',
  {
    ...idColumn,
    formId: uuid('form_id')
      .references(() => requirementForms.id, { onDelete: 'restrict' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    membershipId: uuid('membership_id').references(() => memberships.id, {
      onDelete: 'set null',
    }),
    status: formSubmissionStatusEnum('status')
      .notNull()
      .default(FormSubmissionStatus.SUBMITTED),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_form_submissions_form_id').on(table.formId),
    index('idx_form_submissions_user_id').on(table.userId),
    index('idx_form_submissions_membership_id').on(table.membershipId),
  ],
);

export type FormSubmissionEntity = typeof formSubmissions.$inferSelect;
export type FormSubmissionInsert = typeof formSubmissions.$inferInsert;
