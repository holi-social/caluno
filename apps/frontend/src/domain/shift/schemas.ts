import z from 'zod';

export const shiftFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  startsAt: z.date('Start time is required'),
  endsAt: z.date('End time is required'),
  location: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  openShift: z.boolean().optional(),
  organizationUnitId: z.string().min(1, 'Organization unit is required'),
  invitedMemberIds: z.array(z.string()).optional(),
});

export type ShiftFormValues = z.infer<typeof shiftFormSchema>;

export const shiftDeleteSchema = z.object({
  id: z.string().min(1, 'Shift ID is required'),
  organizationUnitId: z.string().min(1, 'Organization unit ID is required'),
});
