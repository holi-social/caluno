import { boolean, index, integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { formBlocks } from './form-block.schema';
import { requirementForms } from './requirement-form.schema';

export const requirementFormBlockRefs = pgTable(
  'requirement_form_block_refs',
  {
    ...idColumn,
    formId: uuid('form_id')
      .references(() => requirementForms.id, { onDelete: 'cascade' })
      .notNull(),
    blockId: uuid('block_id')
      .references(() => formBlocks.id, { onDelete: 'restrict' })
      .notNull(),
    fieldOrder: integer('field_order').notNull().default(0),
    required: boolean('required'),
    ...timestampColumns,
  },
  (table) => [
    index('idx_requirement_form_block_refs_form_id').on(table.formId),
    index('idx_requirement_form_block_refs_block_id').on(table.blockId),
  ],
);

export type RequirementFormBlockRefEntity =
  typeof requirementFormBlockRefs.$inferSelect;
export type RequirementFormBlockRefInsert =
  typeof requirementFormBlockRefs.$inferInsert;
