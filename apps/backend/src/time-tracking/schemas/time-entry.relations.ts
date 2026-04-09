import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const timeEntryRelations = defineRelationsPart(schema, (r) => ({
  timeEntries: {
    shiftInstance: r.one.shiftInstances({
      from: r.timeEntries.shiftInstanceId,
      to: r.shiftInstances.id,
    }),
  },
}));
