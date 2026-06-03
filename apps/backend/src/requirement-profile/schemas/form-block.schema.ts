import {
  boolean,
  index,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { organizations } from '../../organization/schemas/organization.schema';

export const formBlocks = pgTable(
  'form_blocks',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon'),
    required: boolean('required').notNull().default(true),
    createdBy: text('created_by')
      .references(() => users.id)
      .notNull(),
    updatedBy: text('updated_by')
      .references(() => users.id)
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_form_blocks_organization_id_title').on(
      table.organizationId,
      table.title,
    ),
    index('idx_form_blocks_organization_id').on(table.organizationId),
    index('idx_form_blocks_created_by').on(table.createdBy),
  ],
);

export type FormBlockEntity = typeof formBlocks.$inferSelect;
export type FormBlockInsert = typeof formBlocks.$inferInsert;
