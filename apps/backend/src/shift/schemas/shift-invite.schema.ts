import { index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { InviteOrigin, InviteStatus } from '../../shared/invite-enums';
import {
  inviteOriginEnum,
  shiftInviteStatusEnum,
} from '../../shared/invite-schema';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../enums';
import { shifts } from './shift.schema';

export const shiftInvites = pgTable(
  'shift_invites',
  {
    ...idColumn,
    shiftId: uuid('shift_id')
      .references(() => shifts.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    origin: inviteOriginEnum('origin').$type<
      InviteOrigin | ShiftInviteOrigin | null
    >(),
    status: shiftInviteStatusEnum('status').$type<
      InviteStatus | ShiftInviteStatus | null
    >(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_shift_invites_shift_id').on(table.shiftId),
    index('idx_shift_invites_user_id').on(table.userId),
    index('idx_shift_invites_status').on(table.status),
    index('idx_shift_invites_origin').on(table.origin),
    unique('uq_shift_invites_shift_user').on(table.shiftId, table.userId),
  ],
);

export type ShiftInviteEntity = typeof shiftInvites.$inferSelect;
