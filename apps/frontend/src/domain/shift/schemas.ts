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
  windowViolation?: string;
}

function shiftShape(t: ShiftSchemaMessages) {
  return z.object({
    name: z.string().trim().min(1, t.nameRequired),
    startsAt: z.date(t.startTimeRequired),
    endsAt: z.date(t.endTimeRequired),
    location: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
    openShift: z.boolean().optional(),
    invitedMemberIds: z.array(z.string()).optional(),
    recurrenceDays: z.array(recurrenceDayEnum).optional(),
    recurrenceEndsAt: z.date().optional(),
    imageFileId: z.uuid().nullish(),
  });
}

export function shiftFormSchema(
  t: ShiftSchemaMessages,
  event?: { startsAt: Date; endsAt: Date },
) {
  return shiftShape(t).refine(
    (d) => {
      if (!event) return true;
      return d.startsAt >= event.startsAt && d.endsAt <= event.endsAt;
    },
    { message: t.windowViolation ?? '', path: ['endsAt'] },
  );
}

export const serverShiftFormSchema = shiftFormSchema({
  nameRequired: 'Name is required',
  startTimeRequired: 'Start time is required',
  endTimeRequired: 'End time is required',
});

export type ShiftFormValues = z.infer<typeof serverShiftFormSchema>;

interface ShiftDeleteSchemaMessages {
  shiftIdRequired: string;
  organizationUnitIdRequired: string;
}

export function shiftDeleteSchema(t: ShiftDeleteSchemaMessages) {
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
      inviteAllInstances: z.boolean().optional(),
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
