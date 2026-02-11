import { ProjectStatus } from '@repo/data';
import z from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  organizationId: z.uuid(),
  startsAt: z.date('Start date is required'),
  endsAt: z.date('End date is required'),
  status: z.enum(ProjectStatus).optional(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
