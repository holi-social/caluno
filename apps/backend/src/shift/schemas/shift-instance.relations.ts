import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftInstancesRelations = defineRelationsPart(schema, (r) => ({
  shiftInstances: {
    master: r.one.shifts({
      from: r.shiftInstances.masterId,
      to: r.shifts.id,
    }),
    invites: r.many.shiftInstanceInvites({
      from: r.shiftInstances.id,
      to: r.shiftInstanceInvites.instanceId,
    }),
  },
}));
