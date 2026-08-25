import { integer, primaryKey, snakeCase, uuid } from 'drizzle-orm/pg-core';
import { idColumn } from '../../database/database-columns';
import { requirementForms } from '../../requirement-profile/schemas/requirement-form.schema';
import { events } from './event.schema';

export const eventRequiredForms = snakeCase.table(
  'event_required_forms',
  {
    ...idColumn,
    eventId: uuid('event_id')
      .references(() => events.id, { onDelete: 'cascade' })
      .notNull(),
    formId: uuid('form_id')
      .references(() => requirementForms.id, { onDelete: 'restrict' })
      .notNull(),
    order: integer('order').notNull().default(0),
  },
  (table) => [
    primaryKey({
      name: 'pk_event_required_forms',
      columns: [table.eventId, table.formId],
    }),
  ],
);

export type EventRequiredFormEntity = typeof eventRequiredForms.$inferSelect;
export type EventRequiredFormInsert = typeof eventRequiredForms.$inferInsert;
