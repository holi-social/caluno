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
import { enumValues } from '../../database/typeutil';
import { ShiftInviteStatus } from '../enums';
import { shiftInstances } from './shift-instance.schema';

export const shiftInviteStatusEnum = pgEnum(
  'shift_invite_status',
  enumValues(ShiftInviteStatus),
);

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
    status: shiftInviteStatusEnum('status')
      .$type<ShiftInviteStatus>()
      .notNull()
      .default(ShiftInviteStatus.INVITED),
    ...timestampColumns,
  },
  (table) => [
    index('idx_sii_instance_id').on(table.instanceId),
    index('idx_sii_user_id').on(table.userId),
    index('idx_sii_status').on(table.status),
    unique('uq_sii_instance_user').on(table.instanceId, table.userId),
  ],
);

export type ShiftInstanceInviteEntity =
  typeof shiftInstanceInvites.$inferSelect;
