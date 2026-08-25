import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const filesRelations = defineRelationsPart(schema, (r) => ({
  files: {
    uploadedBy: r.one.users({
      from: r.files.uploadedByUserId,
      to: r.users.id,
    }),
    organizationUnit: r.one.organizationUnits({
      from: r.files.organizationUnitId,
      to: r.organizationUnits.id,
    }),
  },
}));
