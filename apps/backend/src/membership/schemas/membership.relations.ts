import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const membershipRelations = defineRelationsPart(schema, (r) => ({
  memberships: {
    user: r.one.users({
      from: r.memberships.userId,
      to: r.users.id,
    }),
    organization: r.one.organizations({
      from: r.memberships.organizationId,
      to: r.organizations.id,
    }),
    role: r.one.roles({
      from: r.memberships.roleId,
      to: r.roles.id,
    }),
  },
}));
