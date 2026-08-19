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
import { DocumentEventType } from '../enums';
import { contracts } from './contract.schema';

export const documentEventTypeEnum = pgEnum(
  'document_event_type',
  enumValues(DocumentEventType),
);

export const contractEvents = snakeCase.table(
  'contract_events',
  {
    ...idColumn,
    contractId: uuid('contract_id')
      .references(() => contracts.id, { onDelete: 'cascade' })
      .notNull(),
    type: documentEventTypeEnum('type').$type<DocumentEventType>().notNull(),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (table) => [index('idx_contract_events_contract_id').on(table.contractId)],
);

export type ContractEventEntity = typeof contractEvents.$inferSelect;
export type ContractEventInsert = typeof contractEvents.$inferInsert;
