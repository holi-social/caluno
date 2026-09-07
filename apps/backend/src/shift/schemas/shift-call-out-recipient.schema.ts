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
import { ShiftCallOutDeliveryStatus } from '../enums';
import { shiftInstances } from './shift-instance.schema';

export const shiftCallOutDeliveryStatusEnum = pgEnum(
  'shift_call_out_delivery_status',
  enumValues(ShiftCallOutDeliveryStatus),
);

/** One row per recipient per call-out send — the audit trail for who was asked to help, when, and by whom. */
export const shiftCallOutRecipients = snakeCase.table(
  'shift_call_out_recipients',
  {
    ...idColumn,
    instanceId: uuid('instance_id')
      .references(() => shiftInstances.id, { onDelete: 'cascade' })
      .notNull(),
    recipientId: text('recipient_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    sentById: text('sent_by_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    status: shiftCallOutDeliveryStatusEnum('status')
      .$type<ShiftCallOutDeliveryStatus>()
      .notNull(),
    sentAt: timestamp('sent_at').notNull(),
    ...timestampColumns,
  },
  (table) => [
    index('idx_scor_instance_id').on(table.instanceId),
    index('idx_scor_recipient_id').on(table.recipientId),
    index('idx_scor_sent_by_id').on(table.sentById),
    index('idx_scor_sent_at').on(table.sentAt),
  ],
);

export type ShiftCallOutRecipientEntity =
  typeof shiftCallOutRecipients.$inferSelect;
