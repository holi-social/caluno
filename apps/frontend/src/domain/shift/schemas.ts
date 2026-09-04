import { startOfDay } from 'date-fns';
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
  recurrenceEndRequired?: string;
  recurrenceEndBeforeStart?: string;
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
    recurrenceEndMode: z.enum(['never', 'on']).optional(),
    recurrenceEndsAt: z.date().optional(),
    imageFileId: z.uuid().nullish(),
    minVolunteers: z.number().int().nonnegative().nullable().optional(),
    maxVolunteers: z.number().int().nonnegative().nullable().optional(),
    reimbursementTypeId: z.string().nullable().optional(),
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
    )
    .refine(
      (d) => {
        if ((d.recurrenceDays?.length ?? 0) === 0) return true;
        if (d.recurrenceEndMode !== 'on') return true;
        return d.recurrenceEndsAt instanceof Date;
      },
      {
        message: t.recurrenceEndRequired ?? 'End date is required',
        path: ['recurrenceEndsAt'],
      },
    )
    .refine(
      (d) => {
        if (!d.recurrenceEndsAt || !d.startsAt) return true;
        return startOfDay(d.recurrenceEndsAt) >= startOfDay(d.startsAt);
      },
      {
        message:
          t.recurrenceEndBeforeStart ??
          'End date cannot be before the start date',
        path: ['recurrenceEndsAt'],
      },
    );
}

export const serverShiftFormSchema = shiftFormSchema({
  nameRequired: 'Name is required',
  startTimeRequired: 'Start time is required',
  endTimeRequired: 'End time is required',
  minMaxVolunteers: 'Minimum volunteers cannot exceed maximum volunteers',
  recurrenceEndRequired: 'End date is required',
  recurrenceEndBeforeStart: 'End date cannot be before the start date',
});

export type ShiftFormValues = z.infer<typeof serverShiftFormSchema>;

export function editShiftInstanceFormSchema(t: ShiftSchemaMessages) {
  return shiftShape(t)
    .extend({ applyToAllFuture: z.boolean().optional() })
    .refine(
      (d) => {
        if (d.minVolunteers == null || d.maxVolunteers == null) return true;
        return d.minVolunteers <= d.maxVolunteers;
      },
      { message: t.minMaxVolunteers, path: ['maxVolunteers'] },
    )
    .refine(
      (d) => {
        if (!d.applyToAllFuture) return true;
        if ((d.recurrenceDays?.length ?? 0) === 0) return true;
        if (d.recurrenceEndMode !== 'on') return true;
        return d.recurrenceEndsAt instanceof Date;
      },
      {
        message: t.recurrenceEndRequired ?? 'End date is required',
        path: ['recurrenceEndsAt'],
      },
    )
    .refine(
      (d) => {
        if (!d.applyToAllFuture) return true;
        if (!d.recurrenceEndsAt || !d.startsAt) return true;
        return startOfDay(d.recurrenceEndsAt) >= startOfDay(d.startsAt);
      },
      {
        message:
          t.recurrenceEndBeforeStart ??
          'End date cannot be before the start date',
        path: ['recurrenceEndsAt'],
      },
    );
}

export const serverEditShiftInstanceFormSchema = editShiftInstanceFormSchema({
  nameRequired: 'Name is required',
  startTimeRequired: 'Start time is required',
  endTimeRequired: 'End time is required',
  minMaxVolunteers: 'Minimum volunteers cannot exceed maximum volunteers',
  recurrenceEndRequired: 'End date is required',
  recurrenceEndBeforeStart: 'End date cannot be before the start date',
});

export type EditShiftInstanceFormValues = z.infer<
  typeof serverEditShiftInstanceFormSchema
>;

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

interface ShiftInstanceDeleteSchemaMessages {
  instanceIdRequired: string;
  organizationUnitIdRequired: string;
}

export function shiftInstanceDeleteSchema(
  t: ShiftInstanceDeleteSchemaMessages,
) {
  return z.object({
    instanceId: z.string().min(1, t.instanceIdRequired),
    organizationUnitId: z.string().min(1, t.organizationUnitIdRequired),
    applyToAllFuture: z.boolean().optional(),
  });
}

export const serverShiftInstanceDeleteSchema = shiftInstanceDeleteSchema({
  instanceIdRequired: 'Shift instance ID is required',
  organizationUnitIdRequired: 'Organization unit ID is required',
});

export type ShiftInstanceDeleteValues = z.infer<
  typeof serverShiftInstanceDeleteSchema
>;

export function inviteShiftFormSchema() {
  return z.object({
    invitedMemberIds: z.array(z.string()),
    inviteAllInstances: z.boolean().optional(),
  });
}

export const serverInviteShiftFormSchema = inviteShiftFormSchema();

export type InviteShiftFormValues = z.infer<typeof serverInviteShiftFormSchema>;
