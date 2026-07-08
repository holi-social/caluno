import {
  index,
  pgEnum,
  snakeCase,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { EventInviteStatus } from '../enums';
import { events } from './event.schema';

export const eventInviteStatusEnum = pgEnum(
  'event_invite_status',
  EventInviteStatus as Record<string, string>,
);

export const eventInvites = snakeCase.table(
  'event_invites',
  {
    ...idColumn,
    eventId: uuid('event_id')
      .references(() => events.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    status: eventInviteStatusEnum('status')
      .notNull()
      .default(EventInviteStatus.PENDING),
    ...timestampColumns,
  },
  (table) => [
    index('idx_event_invites_event_id').on(table.eventId),
    index('idx_event_invites_user_id').on(table.userId),
    index('idx_event_invites_status').on(table.status),
    unique('uq_event_invites_event_user').on(table.eventId, table.userId),
  ],
);

export type EventInviteEntity = typeof eventInvites.$inferSelect;
