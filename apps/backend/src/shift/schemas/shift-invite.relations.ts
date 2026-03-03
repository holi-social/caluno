import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftInviteRelations = defineRelationsPart(schema, (r) => ({
  shiftInvites: {
    shift: r.one.shifts({
      from: r.shiftInvites.shiftId,
      to: r.shifts.id,
    }),
    user: r.one.users({
      from: r.shiftInvites.userId,
      to: r.users.id,
    }),
  },
}));
