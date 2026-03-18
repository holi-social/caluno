import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const volunteerSessionRelations = defineRelationsPart(schema, (r) => ({
  volunteerSessions: {
    shift: r.one.shifts({
      from: r.volunteerSessions.shiftId,
      to: r.shifts.id,
    }),
    validatedByRel: r.one.users({
      from: r.volunteerSessions.validatedBy,
      to: r.users.id,
    }),
    entries: r.many.timeEntries({
      from: r.volunteerSessions.id,
      to: r.timeEntries.sessionId,
    }),
  },
}));
