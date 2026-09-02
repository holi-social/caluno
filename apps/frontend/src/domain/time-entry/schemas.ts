import z from 'zod';

interface TimeEntrySchemaMessages {
  organizationUnitRequired: string;
  shiftInstanceRequired: string;
  volunteerRequired: string;
  startedAtRequired: string;
  endedAtRequired: string;
  timeEntryIdRequired: string;
}

export function timeEntrySchema(t: TimeEntrySchemaMessages) {
  return z.object({
    organizationUnitId: z.string().min(1, t.organizationUnitRequired),
    shiftId: z.string().optional(),
    shiftInstanceId: z.string().optional(),
    volunteerId: z.string().min(1, t.volunteerRequired),
    startedAt: z.date(t.startedAtRequired),
    endedAt: z.date().nullable().optional(),
    notes: z.string().trim().optional(),
  });
}

export function clientTimeEntrySchema(t: TimeEntrySchemaMessages) {
  return timeEntrySchema(t)
    .extend({ hasShift: z.boolean() })
    .superRefine((data, ctx) => {
      if (data.hasShift && !data.shiftInstanceId) {
        ctx.addIssue({
          code: 'custom',
          path: ['shiftInstanceId'],
          message: t.shiftInstanceRequired,
        });
      }
    });
}

export const serverTimeEntrySchema = timeEntrySchema({
  organizationUnitRequired: 'Organization Unit is required',
  shiftInstanceRequired: 'Shift date is required',
  volunteerRequired: 'Volunteer is required',
  startedAtRequired: 'Start time is required',
  endedAtRequired: 'End time is required',
  timeEntryIdRequired: 'Time Entry ID is required',
});

export type TimeEntryFormValues = z.infer<
  ReturnType<typeof clientTimeEntrySchema>
>;

export function closeTimeEntrySchema(t: TimeEntrySchemaMessages) {
  return z.object({
    id: z.string().min(1, t.timeEntryIdRequired),
    endedAt: z.date(t.endedAtRequired),
    organizationUnitId: z.string().min(1, t.organizationUnitRequired),
    notes: z.string().trim().optional(),
  });
}

export const serverCloseTimeEntrySchema = closeTimeEntrySchema({
  organizationUnitRequired: 'Organization unit ID is required',
  shiftInstanceRequired: 'Shift date is required',
  volunteerRequired: 'Volunteer is required',
  startedAtRequired: 'Start time is required',
  endedAtRequired: 'End time is required',
  timeEntryIdRequired: 'Time Entry ID is required',
});

export function deleteTimeEntrySchema(
  t: Pick<
    TimeEntrySchemaMessages,
    'timeEntryIdRequired' | 'organizationUnitRequired'
  >,
) {
  return z.object({
    id: z.string().min(1, t.timeEntryIdRequired),
    organizationUnitId: z.string().min(1, t.organizationUnitRequired),
  });
}

export const serverDeleteTimeEntrySchema = deleteTimeEntrySchema({
  timeEntryIdRequired: 'Time Entry ID is required',
  organizationUnitRequired: 'Organization unit ID is required',
});

export const serverCheckInVolunteerSchema = z.object({
  organizationUnitId: z.string().min(1, 'Organization Unit is required'),
  volunteerId: z.string().min(1, 'Volunteer is required'),
  shiftInstanceId: z.string().nullable(),
});
