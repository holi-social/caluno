import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const timeEntryRelations = defineRelationsPart(schema, (r) => ({
  timeEntries: {
    shift: r.one.shifts({
      from: r.timeEntries.shiftId,
      to: r.shifts.id,
    }),
  },
}));
