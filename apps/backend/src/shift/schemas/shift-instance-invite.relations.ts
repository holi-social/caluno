import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftInstanceInvitesRelations = defineRelationsPart(
  schema,
  (r) => ({
    shiftInstanceInvites: {
      instance: r.one.shiftInstances({
        from: r.shiftInstanceInvites.instanceId,
        to: r.shiftInstances.id,
      }),
      user: r.one.users({
        from: r.shiftInstanceInvites.userId,
        to: r.users.id,
      }),
    },
  }),
);
