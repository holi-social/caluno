import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { permissions } from '../../auth/schemas/permission.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { SigneeType } from '../enums';
import { invoices } from './invoice.schema';
import { signeeTypeEnum } from './template-signee.schema';

export const invoiceSignatures = snakeCase.table(
  'invoice_signatures',
  {
    ...idColumn,
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'cascade' })
      .notNull(),
    order: integer('order').notNull(),
    signeeType: signeeTypeEnum('signee_type').$type<SigneeType>().notNull(),
    requiredPermissionId: uuid('required_permission_id').references(
      () => permissions.id,
      { onDelete: 'restrict' },
    ),
    signedByUserId: text('signed_by_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    signedAt: timestamp('signed_at'),
    ...timestampColumns,
  },
  (table) => [
    check(
      'chk_invoice_signatures_required_permission_matches_signee_type',
      sql`(${table.signeeType} = 'PERMISSION_HOLDER' AND ${table.requiredPermissionId} IS NOT NULL) OR (${table.signeeType} = 'VOLUNTEER' AND ${table.requiredPermissionId} IS NULL)`,
    ),
  ],
);

export type InvoiceSignatureEntity = typeof invoiceSignatures.$inferSelect;
export type InvoiceSignatureInsert = typeof invoiceSignatures.$inferInsert;
