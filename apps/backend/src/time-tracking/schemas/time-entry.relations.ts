import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const timeEntryRelations = defineRelationsPart(schema, (r) => ({
  timeEntries: {
    volunteer: r.one.users({
      from: r.timeEntries.volunteerId,
      to: r.users.id,
    }),
    shiftInstance: r.one.shiftInstances({
      from: r.timeEntries.shiftInstanceId,
      to: r.shiftInstances.id,
    }),
  },
}));
