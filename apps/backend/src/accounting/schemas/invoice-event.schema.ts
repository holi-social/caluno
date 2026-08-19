import { index, snakeCase, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn } from '../../database/database-columns';
import { DocumentEventType } from '../enums';
import { documentEventTypeEnum } from './contract-event.schema';
import { invoices } from './invoice.schema';

export const invoiceEvents = snakeCase.table(
  'invoice_events',
  {
    ...idColumn,
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'cascade' })
      .notNull(),
    type: documentEventTypeEnum('type').$type<DocumentEventType>().notNull(),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (table) => [index('idx_invoice_events_invoice_id').on(table.invoiceId)],
);

export type InvoiceEventEntity = typeof invoiceEvents.$inferSelect;
export type InvoiceEventInsert = typeof invoiceEvents.$inferInsert;
