import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const membershipRequestRelations = defineRelationsPart(schema, (r) => ({
  membershipRequests: {
    user: r.one.users({
      from: r.membershipRequests.userId,
      to: r.users.id,
    }),
    organizationUnit: r.one.organizationUnits({
      from: r.membershipRequests.organizationUnitId,
      to: r.organizationUnits.id,
    }),
    reviewedBy: r.one.users({
      from: r.membershipRequests.reviewedById,
      to: r.users.id,
    }),
  },
}));
