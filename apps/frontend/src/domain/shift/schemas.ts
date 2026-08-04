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
  minMaxVolunteers: string;
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
    minVolunteers: z.number().int().nonnegative().nullable().optional(),
    maxVolunteers: z.number().int().nonnegative().nullable().optional(),
    requiredFormIds: z.array(z.string()).optional(),
  });
}

export function shiftFormSchema(
  t: ShiftSchemaMessages,
  event?: { startsAt: Date; endsAt: Date },
) {
  return shiftShape(t)
    .refine(
      (d) => {
        if (!event) return true;
        return d.startsAt >= event.startsAt && d.endsAt <= event.endsAt;
      },
      { message: t.windowViolation ?? '', path: ['endsAt'] },
    )
    .refine(
      (d) => {
        if (d.minVolunteers == null || d.maxVolunteers == null) return true;
        return d.minVolunteers <= d.maxVolunteers;
      },
      { message: t.minMaxVolunteers, path: ['maxVolunteers'] },
    );
}

export const serverShiftFormSchema = shiftFormSchema({
  nameRequired: 'Name is required',
  startTimeRequired: 'Start time is required',
  endTimeRequired: 'End time is required',
  minMaxVolunteers: 'Minimum volunteers cannot exceed maximum volunteers',
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

export function inviteShiftFormSchema() {
  return z.object({
    invitedMemberIds: z.array(z.string()),
    inviteAllInstances: z.boolean().optional(),
  });
}

export const serverInviteShiftFormSchema = inviteShiftFormSchema();

export type InviteShiftFormValues = z.infer<typeof serverInviteShiftFormSchema>;
