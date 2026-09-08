import {
  index,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../../auth/schemas/auth.schema';
import { idColumn, timestampColumns } from '../../database/database-columns';
import { enumValues } from '../../database/typeutil';
import {
  ShiftCallOutDeliveryStatus,
  ShiftManagerNotificationKind,
} from '../enums';
import { shiftCallOutDeliveryStatusEnum } from './shift-call-out-recipient.schema';
import { shiftInstances } from './shift-instance.schema';

export const shiftManagerNotificationKindEnum = pgEnum(
  'shift_manager_notification_kind',
  enumValues(ShiftManagerNotificationKind),
);

export const shiftManagerNotifications = snakeCase.table(
  'shift_manager_notifications',
  {
    ...idColumn,
    instanceId: uuid('instance_id')
      .references(() => shiftInstances.id, { onDelete: 'cascade' })
      .notNull(),
    recipientId: text('recipient_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    kind: shiftManagerNotificationKindEnum('kind')
      .$type<ShiftManagerNotificationKind>()
      .notNull(),
    status: shiftCallOutDeliveryStatusEnum('status')
      .$type<ShiftCallOutDeliveryStatus>()
      .notNull(),
    sentAt: timestamp('sent_at').notNull(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_smn_instance_id').on(table.instanceId),
    index('idx_smn_recipient_id').on(table.recipientId),
    index('idx_smn_sent_at').on(table.sentAt),
  ],
);

export type ShiftManagerNotificationEntity =
  typeof shiftManagerNotifications.$inferSelect;
