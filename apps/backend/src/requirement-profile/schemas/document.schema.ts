import { index, snakeCase, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';

export const documents = snakeCase.table(
  'documents',
  {
    ...idColumn,
    userId: text('user_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    storageKey: text('storage_key').notNull().unique(),
    mimeType: text('mime_type').notNull(),
    uploadedAt: timestamp('uploaded_at').notNull(),
    ...timestampColumns,
  },
  (table) => [index('idx_documents_user_id').on(table.userId)],
);

export type DocumentEntity = typeof documents.$inferSelect;
export type DocumentInsert = typeof documents.$inferInsert;
