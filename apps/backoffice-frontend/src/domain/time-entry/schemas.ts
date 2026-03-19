import z from 'zod';

export const createTimeEntrySchema = z.object({
  shiftId: z.string(),
  volunteerId: z.string(),
  startedAt: z.string().min(1, 'Start time is required'),
  endedAt: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type CreateTimeEntryFormValues = z.infer<typeof createTimeEntrySchema>;
