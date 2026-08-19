import { snakeCase, unique, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { timeEntries } from '../../time-tracking/schemas/time-entry.schema';
import { invoices } from './invoice.schema';

export const invoiceTimeEntries = snakeCase.table(
  'invoice_time_entries',
  {
    ...idColumn,
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'cascade' })
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
