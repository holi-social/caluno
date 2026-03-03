import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const timeEntryRelations = defineRelationsPart(schema, (r) => ({
  timeEntries: {
    session: r.one.volunteerSessions({
      from: r.timeEntries.sessionId,
      to: r.volunteerSessions.id,
    }),
  },
}));
