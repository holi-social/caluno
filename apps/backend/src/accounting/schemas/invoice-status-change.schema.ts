import { index, snakeCase, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn } from '../../database/database-columns';
import { DocumentStatusChange } from '../enums';
import { documentStatusChangeEnum } from './contract-status-change.schema';
import { invoices } from './invoice.schema';

export const invoiceStatusChanges = snakeCase.table(
  'invoice_status_changes',
  {
    ...idColumn,
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'cascade' })
      .notNull(),
    type: documentStatusChangeEnum('type')
      .$type<DocumentStatusChange>()
      .notNull(),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_invoice_status_changes_invoice_id').on(table.invoiceId),
  ],
);

export type InvoiceStatusChangeEntity =
  typeof invoiceStatusChanges.$inferSelect;
export type InvoiceStatusChangeInsert =
  typeof invoiceStatusChanges.$inferInsert;
