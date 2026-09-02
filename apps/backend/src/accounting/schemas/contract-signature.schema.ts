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
import { contracts } from './contract.schema';
import { signeeTypeEnum } from './template-signee.schema';

export const contractSignatures = snakeCase.table(
  'contract_signatures',
  {
    ...idColumn,
    contractId: uuid('contract_id')
      .references(() => contracts.id, { onDelete: 'cascade' })
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
      'chk_contract_signatures_required_permission_matches_signee_type',
      sql`(${table.signeeType} = 'PERMISSION_HOLDER' AND ${table.requiredPermissionId} IS NOT NULL) OR (${table.signeeType} = 'VOLUNTEER' AND ${table.requiredPermissionId} IS NULL)`,
    ),
  ],
);

export type ContractSignatureEntity = typeof contractSignatures.$inferSelect;
export type ContractSignatureInsert = typeof contractSignatures.$inferInsert;
