import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const membershipRelations = defineRelationsPart(schema, (r) => ({
  memberships: {
    user: r.one.users({
      from: r.memberships.userId,
      to: r.users.id,
    }),
    role: r.one.roles({
      from: r.memberships.roleId,
      to: r.roles.id,
    }),
    organizationUnit: r.one.organizationUnits({
      from: r.memberships.roleId.through(r.roles.id),
      to: r.organizationUnits.id.through(r.roles.organizationUnitId),
    }),
  },
}));
