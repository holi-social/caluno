import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const membershipRequestRelations = defineRelationsPart(schema, (r) => ({
  membershipRequests: {
    organization: r.one.organizations({
      from: r.membershipRequests.organizationId,
      to: r.organizations.id,
    }),
  },
}));
