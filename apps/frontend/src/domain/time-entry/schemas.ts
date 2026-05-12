import z from 'zod';

export const createTimeEntrySchema = z.object({
  organizationUnitId: z.string().min(1, 'Organization unit ID is required'),
  shiftInstanceId: z.string(),
  volunteerId: z.string(),
  startedAt: z.date('Start time is required'),
  endedAt: z.date().nullable(),
  notes: z.string().trim().optional(),
});

export type CreateTimeEntryFormValues = z.infer<typeof createTimeEntrySchema>;

export const closeTimeEntrySchema = z.object({
  id: z.string().min(1, 'Time Entry ID is required'),
  endedAt: z.date('End time is required'),
  organizationUnitId: z.string().min(1, 'Organization unit ID is required'),
  notes: z.string().trim().optional(),
});

export const deleteTimeEntrySchema = z.object({
  id: z.string().min(1, 'Time Entry ID is required'),
  organizationUnitId: z.string().min(1, 'Organization unit ID is required'),
});
