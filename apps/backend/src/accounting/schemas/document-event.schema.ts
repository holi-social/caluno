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
import { createdDocuments } from './created-document.schema';

export const documentEventTypeEnum = pgEnum(
  'document_event_type',
  enumValues(DocumentEventType),
);

export const documentEvents = snakeCase.table(
  'document_events',
  {
    ...idColumn,
    createdDocumentId: uuid('created_document_id')
      .references(() => createdDocuments.id, { onDelete: 'cascade' })
      .notNull(),
    type: documentEventTypeEnum('type').$type<DocumentEventType>().notNull(),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_document_events_created_document_id').on(
      table.createdDocumentId,
    ),
  ],
);

export type DocumentEventEntity = typeof documentEvents.$inferSelect;
export type DocumentEventInsert = typeof documentEvents.$inferInsert;
