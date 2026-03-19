import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const projectRelations = defineRelationsPart(schema, (r) => ({
  projects: {
    organization: r.one.organizations({
      from: r.projects.organizationId,
      to: r.organizations.id,
    }),
    createdBy: r.one.users({
      from: r.projects.createdById,
      to: r.users.id,
    }),
  },
}));
