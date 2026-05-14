import z from 'zod';

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

export const timeEntrySchema = z.object({
  organizationUnitId: z.string().min(1, 'Organization Unit is required'),
  shiftInstanceId: z.string().min(1, 'Shift is required'),
  volunteerId: z.string().min(1, 'Volunteer is required'),
  startedAt: z.date('Start time is required'),
  endedAt: z.date().nullable().optional(),
  notes: z.string().trim().optional(),
});

export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;
