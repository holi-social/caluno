import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const organizationRelations = defineRelationsPart(schema, (r) => ({
  organizations: {
    parent: r.one.organizations({
      from: r.organizations.parentId,
      to: r.organizations.id,
      alias: 'parentChild',
    }),
    children: r.many.organizations({
      from: r.organizations.id,
      to: r.organizations.parentId,
      alias: 'parentChild',
    }),
    memberships: r.many.memberships({
      from: r.organizations.id,
      to: r.memberships.organizationId,
    }),
  },
}));
