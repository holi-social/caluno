import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftRelations = defineRelationsPart(schema, (r) => ({
  shifts: {
    organizationUnit: r.one.organizationUnits({
      from: r.shifts.organizationUnitId,
      to: r.organizationUnits.id,
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
