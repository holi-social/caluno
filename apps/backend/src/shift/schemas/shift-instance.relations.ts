import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftInstancesRelations = defineRelationsPart(schema, (r) => ({
  shiftInstances: {
    master: r.one.shifts({
      from: r.shiftInstances.masterId,
      to: r.shifts.id,
      optional: false,
    }),
    invites: r.many.shiftInstanceInvites({
      from: r.shiftInstances.id,
      to: r.shiftInstanceInvites.instanceId,
    }),
    requiredForms: r.many.shiftInstanceRequiredForms({
      from: r.shiftInstances.id,
      to: r.shiftInstanceRequiredForms.shiftInstanceId,
    }),
  },
  shiftInstanceRequiredForms: {
    shiftInstance: r.one.shiftInstances({
      from: r.shiftInstanceRequiredForms.shiftInstanceId,
      to: r.shiftInstances.id,
    }),
    form: r.one.requirementForms({
      from: r.shiftInstanceRequiredForms.formId,
      to: r.requirementForms.id,
    }),
  },
}));
