import {
  boolean,
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
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { files } from '../../storage/schemas/file.schema';
import { InvoiceStatus } from '../enums';
import { documentTemplates } from './document-template.schema';
import { reimbursementTypes } from './reimbursement-type.schema';
import { signeeTypeEnum } from './template-signee.schema';

export const invoiceStatusEnum = pgEnum(
  'invoice_status',
  enumValues(InvoiceStatus),
);

export type InvoiceBody = {
  header: unknown;
  blocks: unknown[];
  footer: unknown;
};

export const invoices = snakeCase.table('invoices', {
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
  organizationUnitId: uuid('organization_unit_id').references(
    () => organizationUnits.id,
    { onDelete: 'restrict' },
  ),
  fileId: uuid('file_id').references(() => files.id, { onDelete: 'set null' }),
  invoiceStatus: invoiceStatusEnum('invoice_status')
    .$type<InvoiceStatus>()
    .notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  totalHours: numeric('total_hours', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),
  isNonCompliant: boolean('is_non_compliant').notNull().default(false),
  resolvedBody: jsonb('resolved_body').$type<InvoiceBody>().notNull(),
  declineReason: text('decline_reason'),
  declinedByUserId: text('declined_by_user_id').references(() => users.id, {
    onDelete: 'restrict',
  }),
  paidAt: timestamp('paid_at'),
  paidByUserId: text('paid_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  declinedAt: timestamp('declined_at'),
  declinedAtSigneeType: signeeTypeEnum('declined_at_signee_type'),
  ...timestampColumns,
});

export type InvoiceEntity = typeof invoices.$inferSelect;
export type InvoiceInsert = typeof invoices.$inferInsert;
