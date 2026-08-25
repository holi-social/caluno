import { index, snakeCase, text, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { InviteOrigin, InviteStatus } from '../../shared/invite-enums';
import {
  eventInviteStatusEnum,
  inviteOriginEnum,
} from '../../shared/invite-schema';
import { EventInviteOrigin, EventInviteStatus } from '../enums';
import { events } from './event.schema';

export { eventInviteStatusEnum };

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
    origin: inviteOriginEnum('origin').$type<
      InviteOrigin | EventInviteOrigin | null
    >(),
    status: eventInviteStatusEnum('status').$type<
      InviteStatus | EventInviteStatus | null
    >(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_event_invites_event_id').on(table.eventId),
    index('idx_event_invites_user_id').on(table.userId),
    index('idx_event_invites_status').on(table.status),
    index('idx_event_invites_origin').on(table.origin),
    unique('uq_event_invites_event_user').on(table.eventId, table.userId),
  ],
);

export type EventInviteEntity = typeof eventInvites.$inferSelect;
