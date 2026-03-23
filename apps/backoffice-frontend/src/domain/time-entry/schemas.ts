import z from 'zod';

export const createTimeEntrySchema = z.object({
  shiftId: z.string(),
  volunteerId: z.string(),
  startedAt: z.string().min(1, 'Start time is required'),
  endedAt: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type CreateTimeEntryFormValues = z.infer<typeof createTimeEntrySchema>;

export const closeTimeEntrySchema = z.object({
  id: z.string().min(1, 'Time Entry ID is required'),
  endedAt: z.date('End time is required'),
  notes: z.string().trim().optional(),
});
