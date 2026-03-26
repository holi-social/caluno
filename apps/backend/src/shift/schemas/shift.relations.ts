import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftRelations = defineRelationsPart(schema, (r) => ({
  shifts: {
    organization: r.one.organizations({
      from: r.shifts.organizationId,
      to: r.organizations.id,
    }),
    createdBy: r.one.users({
      from: r.shifts.createdById,
      to: r.users.id,
    }),
    invites: r.many.shiftInvites({
      from: r.shifts.id,
      to: r.shiftInvites.shiftId,
    }),
  },
}));
