import { integer, primaryKey, snakeCase, uuid } from 'drizzle-orm/pg-core';
import { idColumn } from '../../database/database-columns';
import { requirementForms } from '../../requirement-profile/schemas/requirement-form.schema';
import { shiftInstances } from './shift-instance.schema';

export const shiftInstanceRequiredForms = snakeCase.table(
  'shift_instance_required_forms',
  {
    ...idColumn,
    shiftInstanceId: uuid('shift_instance_id')
      .references(() => shiftInstances.id, { onDelete: 'cascade' })
      .notNull(),
    formId: uuid('form_id')
      .references(() => requirementForms.id, { onDelete: 'restrict' })
      .notNull(),
    order: integer('order').notNull().default(0),
  },
  (table) => [
    primaryKey({
      name: 'pk_shift_instance_required_forms',
      columns: [table.shiftInstanceId, table.formId],
    }),
  ],
);

export type ShiftInstanceRequiredFormEntity =
  typeof shiftInstanceRequiredForms.$inferSelect;
export type ShiftInstanceRequiredFormInsert =
  typeof shiftInstanceRequiredForms.$inferInsert;
