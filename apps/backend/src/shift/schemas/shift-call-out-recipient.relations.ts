import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftCallOutRecipientsRelations = defineRelationsPart(
  schema,
  (r) => ({
    shiftCallOutRecipients: {
      instance: r.one.shiftInstances({
        from: r.shiftCallOutRecipients.instanceId,
        to: r.shiftInstances.id,
      }),
      recipient: r.one.users({
        from: r.shiftCallOutRecipients.recipientId,
        to: r.users.id,
      }),
      sentBy: r.one.users({
        from: r.shiftCallOutRecipients.sentById,
        to: r.users.id,
      }),
    },
  }),
);
