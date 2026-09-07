import { sql } from 'drizzle-orm';
import { boolean, snakeCase, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
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
    // Set true when the holding invoice is declined, releasing the time
    // entry back into the eligible pool without deleting the row - the
    // claim history for the declined document is kept intact.
    released: boolean('released').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    // A time entry can only be claimed by one *live* (non-declined) invoice
    // at a time. Declining an invoice flips `released` to true, which drops
    // its row out of this partial index and frees the time entry up again.
    uniqueIndex('uq_invoice_time_entries_time_entry_id')
      .on(table.timeEntryId)
      .where(sql`${table.released} = false`),
  ],
);

export type InvoiceTimeEntryEntity = typeof invoiceTimeEntries.$inferSelect;
export type InvoiceTimeEntryInsert = typeof invoiceTimeEntries.$inferInsert;
