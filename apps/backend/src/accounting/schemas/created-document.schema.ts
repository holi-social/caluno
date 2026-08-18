import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  jsonb,
  numeric,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { ContractStatus, DocumentKind, InvoiceStatus } from '../enums';
import {
  documentKindEnum,
  documentTemplates,
} from './document-template.schema';
import { reimbursementTypes } from './reimbursement-type.schema';
import { signeeTypeEnum } from './template-signee.schema';

export const contractStatusEnum = pgEnum(
  'contract_status',
  enumValues(ContractStatus),
);
export const invoiceStatusEnum = pgEnum(
  'invoice_status',
  enumValues(InvoiceStatus),
);

export type CreatedDocumentBody = {
  header: unknown;
  blocks: unknown[];
  footer: unknown;
};

export const createdDocuments = snakeCase.table(
  'created_documents',
  {
    ...idColumn,
    documentTemplateId: uuid('document_template_id')
      .references(() => documentTemplates.id, { onDelete: 'restrict' })
      .notNull(),
    volunteerId: text('volunteer_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    reimbursementTypeId: uuid('reimbursement_type_id')
      .references(() => reimbursementTypes.id, { onDelete: 'restrict' })
      .notNull(),
    kind: documentKindEnum('kind').$type<DocumentKind>().notNull(),
    contractStatus:
      contractStatusEnum('contract_status').$type<ContractStatus>(),
    invoiceStatus: invoiceStatusEnum('invoice_status').$type<InvoiceStatus>(),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    renewDate: timestamp('renew_date'),
    totalAmountCents: integer('total_amount_cents'),
    totalHours: numeric('total_hours', {
      precision: 10,
      scale: 2,
      mode: 'number',
    }),
    isNonCompliant: boolean('is_non_compliant').notNull().default(false),
    resolvedBody: jsonb('resolved_body').$type<CreatedDocumentBody>().notNull(),
    declineReason: text('decline_reason'),
    declinedByUserId: text('declined_by_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    declinedAt: timestamp('declined_at'),
    declinedAtSigneeType: signeeTypeEnum('declined_at_signee_type'),
    ...timestampColumns,
  },
  (table) => [
    check(
      'chk_created_documents_status_matches_kind',
      sql`(${table.kind} = 'CONTRACT' AND ${table.contractStatus} IS NOT NULL AND ${table.invoiceStatus} IS NULL) OR (${table.kind} = 'INVOICE' AND ${table.invoiceStatus} IS NOT NULL AND ${table.contractStatus} IS NULL)`,
    ),
  ],
);

export type CreatedDocumentEntity = typeof createdDocuments.$inferSelect;
export type CreatedDocumentInsert = typeof createdDocuments.$inferInsert;
