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

export const shiftFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  startsAt: z.date('Start time is required'),
  endsAt: z.date('End time is required'),
  location: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  organizationUnitId: z.string().min(1, 'Organization unit is required'),
  invitedMemberIds: z.array(z.string()).optional(),
  recurrenceDays: z.array(recurrenceDayEnum).optional(),
  recurrenceEndsAt: z.date().optional(),
});

export type ShiftFormValues = z.infer<typeof shiftFormSchema>;

export const shiftDeleteSchema = z.object({
  id: z.string().min(1, 'Shift ID is required'),
  organizationUnitId: z.string().min(1, 'Organization unit ID is required'),
});

export const inviteShiftFormSchema = z
  .object({
    minVolunteers: z.number().int().min(1).nullable().optional(),
    maxVolunteers: z.number().int().min(1).nullable().optional(),
    invitedMemberIds: z.array(z.string()),
  })
  .refine(
    (data) => {
      if (data.minVolunteers == null || data.maxVolunteers == null) return true;
      return data.minVolunteers <= data.maxVolunteers;
    },
    {
      message: 'Minimum volunteers cannot exceed maximum volunteers',
      path: ['maxVolunteers'],
    },
  );

export type InviteShiftFormValues = z.infer<typeof inviteShiftFormSchema>;
