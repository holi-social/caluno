import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftManagerNotificationsRelations = defineRelationsPart(
  schema,
  (r) => ({
    shiftManagerNotifications: {
      instance: r.one.shiftInstances({
        from: r.shiftManagerNotifications.instanceId,
        to: r.shiftInstances.id,
      }),
      recipient: r.one.users({
        from: r.shiftManagerNotifications.recipientId,
        to: r.users.id,
      }),
    },
  }),
);
