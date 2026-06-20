import z from 'zod';

const recurrenceDayEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

interface ShiftSchemaMessages {
  nameRequired: string;
  startTimeRequired: string;
  endTimeRequired: string;
  organizationUnitRequired: string;
  organizationUnitIdRequired: string;
  shiftIdRequired: string;
  minMaxVolunteers: string;
}

export function shiftFormSchema(t: ShiftSchemaMessages) {
  return z.object({
    name: z.string().trim().min(1, t.nameRequired),
    startsAt: z.date(t.startTimeRequired),
    endsAt: z.date(t.endTimeRequired),
    location: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
    organizationUnitId: z.string().min(1, t.organizationUnitRequired),
    invitedMemberIds: z.array(z.string()).optional(),
    recurrenceDays: z.array(recurrenceDayEnum).optional(),
    recurrenceEndsAt: z.date().optional(),
  });
}

export const serverShiftFormSchema = shiftFormSchema({
  nameRequired: 'Name is required',
  startTimeRequired: 'Start time is required',
  endTimeRequired: 'End time is required',
  organizationUnitRequired: 'Organization unit is required',
  organizationUnitIdRequired: 'Organization unit ID is required',
  shiftIdRequired: 'Shift ID is required',
  minMaxVolunteers: 'Minimum volunteers cannot exceed maximum volunteers',
});

export type ShiftFormValues = z.infer<typeof serverShiftFormSchema>;

export function updateShiftFormSchema(t: ShiftSchemaMessages) {
  return shiftFormSchema(t).extend({
    id: z.string().min(1, t.shiftIdRequired),
  });
}

export const serverUpdateShiftFormSchema = updateShiftFormSchema({
  nameRequired: 'Name is required',
  startTimeRequired: 'Start time is required',
  endTimeRequired: 'End time is required',
  organizationUnitRequired: 'Organization unit is required',
  organizationUnitIdRequired: 'Organization unit ID is required',
  shiftIdRequired: 'Shift ID is required',
  minMaxVolunteers: 'Minimum volunteers cannot exceed maximum volunteers',
});

export function shiftDeleteSchema(
  t: Pick<
    ShiftSchemaMessages,
    'shiftIdRequired' | 'organizationUnitIdRequired'
  >,
) {
  return z.object({
    id: z.string().min(1, t.shiftIdRequired),
    organizationUnitId: z.string().min(1, t.organizationUnitIdRequired),
  });
}

export const serverShiftDeleteSchema = shiftDeleteSchema({
  shiftIdRequired: 'Shift ID is required',
  organizationUnitIdRequired: 'Organization unit ID is required',
});

export type ShiftDeleteValues = z.infer<typeof serverShiftDeleteSchema>;

interface InviteShiftSchemaMessages {
  minMaxVolunteers: string;
}

export function inviteShiftFormSchema(t: InviteShiftSchemaMessages) {
  return z
    .object({
      minVolunteers: z.number().int().min(1).nullable().optional(),
      maxVolunteers: z.number().int().min(1).nullable().optional(),
      invitedMemberIds: z.array(z.string()),
    })
    .refine(
      (data) => {
        if (data.minVolunteers == null || data.maxVolunteers == null)
          return true;
        return data.minVolunteers <= data.maxVolunteers;
      },
      {
        message: t.minMaxVolunteers,
        path: ['maxVolunteers'],
      },
    );
}

export const serverInviteShiftFormSchema = inviteShiftFormSchema({
  minMaxVolunteers: 'Minimum volunteers cannot exceed maximum volunteers',
});

export type InviteShiftFormValues = z.infer<typeof serverInviteShiftFormSchema>;
