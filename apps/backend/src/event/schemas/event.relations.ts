import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const eventsRelations = defineRelationsPart(schema, (r) => ({
  events: {
    organizationUnit: r.one.organizationUnits({
      from: r.events.organizationUnitId,
      to: r.organizationUnits.id,
    }),
    createdBy: r.one.users({
      from: r.events.createdById,
      to: r.users.id,
    }),
    invites: r.many.eventInvites({
      from: r.events.id,
      to: r.eventInvites.eventId,
    }),
  },
}));
