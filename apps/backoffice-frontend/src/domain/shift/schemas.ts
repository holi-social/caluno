import z from 'zod';

export const shiftFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  startsAt: z.string().min(1, 'Start time is required'),
  endsAt: z.string().min(1, 'End time is required'),
  location: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  openShift: z.boolean().optional(),
  projectId: z.string().optional(),
  organizationId: z.string().min(1, 'Organization is required'),
  invitedMemberIds: z.array(z.string()).optional(),
});

export type ShiftFormValues = z.infer<typeof shiftFormSchema>;

export const shiftDeleteSchema = z.object({
  id: z.string().min(1, 'Shift ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
});
