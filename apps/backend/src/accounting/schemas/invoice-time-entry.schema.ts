import { snakeCase, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { timeEntries } from '../../time-tracking/schemas/time-entry.schema';
import { createdDocuments } from './created-document.schema';

export const invoiceTimeEntries = snakeCase.table(
  'invoice_time_entries',
  {
    ...idColumn,
    createdDocumentId: uuid('created_document_id')
      .references(() => createdDocuments.id, { onDelete: 'cascade' })
      .notNull(),
    timeEntryId: uuid('time_entry_id')
      .references(() => timeEntries.id, { onDelete: 'restrict' })
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    unique('uq_invoice_time_entries_time_entry_id').on(table.timeEntryId),
  ],
);

export type InvoiceTimeEntryEntity = typeof invoiceTimeEntries.$inferSelect;
export type InvoiceTimeEntryInsert = typeof invoiceTimeEntries.$inferInsert;
