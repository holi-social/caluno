import { integer, primaryKey, snakeCase, uuid } from 'drizzle-orm/pg-core';
import { idColumn } from '../../database/database-columns';
import { requirementForms } from '../../requirement-profile/schemas/requirement-form.schema';
import { shifts } from './shift.schema';

export const shiftRequiredForms = snakeCase.table(
  'shift_required_forms',
  {
    ...idColumn,
    shiftId: uuid('shift_id')
      .references(() => shifts.id, { onDelete: 'cascade' })
      .notNull(),
    formId: uuid('form_id')
      .references(() => requirementForms.id, { onDelete: 'restrict' })
      .notNull(),
    order: integer('order').notNull().default(0),
  },
  (table) => [
    primaryKey({
      name: 'pk_shift_required_forms',
      columns: [table.shiftId, table.formId],
    }),
  ],
);

export type ShiftRequiredFormEntity = typeof shiftRequiredForms.$inferSelect;
export type ShiftRequiredFormInsert = typeof shiftRequiredForms.$inferInsert;
