import {
  boolean,
  jsonb,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { files } from '../../storage/schemas/file.schema';
import { organizationUnits } from '../../organization/schemas/organization-unit.schema';
import { ContractStatus } from '../enums';
import { documentTemplates } from './document-template.schema';
import { reimbursementTypes } from './reimbursement-type.schema';
import { signeeTypeEnum } from './template-signee.schema';

export const contractStatusEnum = pgEnum(
  'contract_status',
  enumValues(ContractStatus),
);

export type ContractBody = {
  header: unknown;
  blocks: unknown[];
  footer: unknown;
};

export const contracts = snakeCase.table('contracts', {
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
  contractStatus: contractStatusEnum('contract_status')
    .$type<ContractStatus>()
    .notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  renewDate: timestamp('renew_date'),
  isNonCompliant: boolean('is_non_compliant').notNull().default(false),
  resolvedBody: jsonb('resolved_body').$type<ContractBody>().notNull(),
  declineReason: text('decline_reason'),
  declinedByUserId: text('declined_by_user_id').references(() => users.id, {
    onDelete: 'restrict',
  }),
  declinedAt: timestamp('declined_at'),
  declinedAtSigneeType: signeeTypeEnum('declined_at_signee_type'),
  ...timestampColumns,
});

export type ContractEntity = typeof contracts.$inferSelect;
export type ContractInsert = typeof contracts.$inferInsert;
