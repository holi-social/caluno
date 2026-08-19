import { sql } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { organizations } from '../../organization/schemas/organization.schema';
import { DocumentKind, RenewalCadence } from '../enums';
import { reimbursementTypes } from './reimbursement-type.schema';

export const documentKindEnum = pgEnum(
  'document_kind',
  enumValues(DocumentKind),
);
export const renewalCadenceEnum = pgEnum(
  'renewal_cadence',
  enumValues(RenewalCadence),
);

export type DocumentTemplateBody = {
  header: unknown;
  blocks: unknown[];
  footer: unknown;
};

export const documentTemplates = snakeCase.table(
  'document_templates',
  {
    ...idColumn,
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    reimbursementTypeId: uuid('reimbursement_type_id')
      .references(() => reimbursementTypes.id, { onDelete: 'restrict' })
      .notNull(),
    kind: documentKindEnum('kind').$type<DocumentKind>().notNull(),
    renewalCadence:
      renewalCadenceEnum('renewal_cadence').$type<RenewalCadence>(),
    invoiceNumberFormat: text('invoice_number_format'),
    body: jsonb('body').$type<DocumentTemplateBody>().notNull(),
    lastEditedAt: timestamp('last_edited_at'),
    lastEditedBy: text('last_edited_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex(
      'uq_document_templates_organization_id_reimbursement_type_id_kind',
    )
      .on(table.organizationId, table.reimbursementTypeId, table.kind)
      .where(sql`${table.isDeleted} = false`),
  ],
);

export type DocumentTemplateEntity = typeof documentTemplates.$inferSelect;
export type DocumentTemplateInsert = typeof documentTemplates.$inferInsert;
