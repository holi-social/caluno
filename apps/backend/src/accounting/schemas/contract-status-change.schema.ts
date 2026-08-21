import {
  index,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import { DocumentStatusChange } from '../enums';
import { contracts } from './contract.schema';

export const documentStatusChangeEnum = pgEnum(
  'document_status_change',
  enumValues(DocumentStatusChange),
);

export const contractStatusChanges = snakeCase.table(
  'contract_status_changes',
  {
    ...idColumn,
    contractId: uuid('contract_id')
      .references(() => contracts.id, { onDelete: 'cascade' })
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
    index('idx_contract_status_changes_contract_id').on(table.contractId),
  ],
);

export type ContractStatusChangeEntity =
  typeof contractStatusChanges.$inferSelect;
export type ContractStatusChangeInsert =
  typeof contractStatusChanges.$inferInsert;
