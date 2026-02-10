import z from 'zod';

export const createShiftSchema = z.object({
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

export type CreateShiftFormValues = z.infer<typeof createShiftSchema>;
