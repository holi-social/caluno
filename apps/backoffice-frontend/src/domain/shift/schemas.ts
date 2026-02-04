import { ShiftVisibility } from '@repo/data';
import z from 'zod';

export const createShiftSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startsAt: z.string().min(1, 'Start time is required'),
  endsAt: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  instructions: z.string().min(1, 'Instructions are required'),
  visibility: z.enum(ShiftVisibility),
  projectId: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

export type CreateShiftFormValues = z.infer<typeof createShiftSchema>;
