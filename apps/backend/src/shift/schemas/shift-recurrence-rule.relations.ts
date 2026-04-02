import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const shiftRecurrenceRuleRelations = defineRelationsPart(
  schema,
  (r) => ({
    shiftRecurrenceRules: {
      shift: r.one.shifts({
        from: r.shiftRecurrenceRules.shiftId,
        to: r.shifts.id,
      }),
    },
  }),
);
