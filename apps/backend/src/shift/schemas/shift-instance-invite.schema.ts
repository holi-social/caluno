import { index, snakeCase, text, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { InviteOrigin, InviteStatus } from '../../shared/invite-enums';
import {
  inviteOriginEnum,
  shiftInviteStatusEnum,
} from '../../shared/invite-schema';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../enums';
import { shiftInstances } from './shift-instance.schema';

export { inviteOriginEnum, shiftInviteStatusEnum };

export const shiftInstanceInvites = snakeCase.table(
  'shift_instance_invites',
  {
    ...idColumn,
    instanceId: uuid('instance_id')
      .references(() => shiftInstances.id, { onDelete: 'cascade' })
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
    index('idx_sii_instance_id').on(table.instanceId),
    index('idx_sii_user_id').on(table.userId),
    index('idx_sii_status').on(table.status),
    index('idx_sii_origin').on(table.origin),
    unique('uq_sii_instance_user').on(table.instanceId, table.userId),
  ],
);

export type ShiftInstanceInviteEntity =
  typeof shiftInstanceInvites.$inferSelect;
