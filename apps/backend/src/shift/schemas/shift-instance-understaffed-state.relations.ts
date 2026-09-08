import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftInstanceUnderstaffedStatesRelations = defineRelationsPart(
  schema,
  (r) => ({
    shiftInstanceUnderstaffedStates: {
      instance: r.one.shiftInstances({
        from: r.shiftInstanceUnderstaffedStates.instanceId,
        to: r.shiftInstances.id,
      }),
    },
  }),
);
