import {
  index,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { ShiftInviteStatus } from '../enums';
import { shifts } from './shift.schema';

export const shiftInviteStatusEnum = pgEnum(
  'shift_invite_status',
  ShiftInviteStatus as Record<string, string>,
);

export const shiftInvites = pgTable(
  'shift_invites',
  {
    ...idColumn,
    shiftId: uuid('shift_id')
      .references(() => shifts.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, {
        onDelete: 'restrict',
      })
      .notNull(),
    status: shiftInviteStatusEnum('status')
      .notNull()
      .default(ShiftInviteStatus.PENDING),
    ...timestampColumns,
  },
  (table) => [
    index('idx_shift_invites_shift_id').on(table.shiftId),
    index('idx_shift_invites_user_id').on(table.userId),
    index('idx_shift_invites_status').on(table.status),
    unique('uq_shift_invites_shift_id_user_id').on(table.shiftId, table.userId),
  ],
);
