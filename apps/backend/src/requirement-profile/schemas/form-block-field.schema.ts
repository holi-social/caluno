import {
  boolean,
  index,
  integer,
  jsonb,
  snakeCase,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { formBlocks } from './form-block.schema';

export const formBlockFields = snakeCase.table(
  'form_block_fields',
  {
    ...idColumn,
    blockId: uuid('block_id')
      .references(() => formBlocks.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    label: text('label').notNull(),
    placeholder: text('placeholder'),
    description: text('description'),
    required: boolean('required').notNull().default(false),
    lockType: boolean('lock_type').notNull().default(false),
    systemKey: text('system_key'),
    options: jsonb('options').$type<Array<{ label: string; value: string }>>(),
    documentUrl: text('document_url'),
    documentLabel: text('document_label'),
    minAge: integer('min_age'),
    fieldOrder: integer('field_order').notNull().default(0),
    ...timestampColumns,
  },
  (table) => [
    index('idx_form_block_fields_block_id').on(table.blockId),
    index('idx_form_block_fields_system_key').on(table.systemKey),
  ],
);

export type FormBlockFieldEntity = typeof formBlockFields.$inferSelect;
export type FormBlockFieldInsert = typeof formBlockFields.$inferInsert;
