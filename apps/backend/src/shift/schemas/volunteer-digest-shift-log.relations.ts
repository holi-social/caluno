import { defineRelationsPart } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const volunteerDigestShiftLogsRelations = defineRelationsPart(
  schema,
  (r) => ({
    volunteerDigestShiftLogs: {
      user: r.one.users({
        from: r.volunteerDigestShiftLogs.userId,
        to: r.users.id,
      }),
      shift: r.one.shifts({
        from: r.volunteerDigestShiftLogs.shiftId,
        to: r.shifts.id,
      }),
      instance: r.one.shiftInstances({
        from: r.volunteerDigestShiftLogs.instanceId,
        to: r.shiftInstances.id,
      }),
      organization: r.one.organizations({
        from: r.volunteerDigestShiftLogs.organizationId,
        to: r.organizations.id,
      }),
    },
  }),
);
