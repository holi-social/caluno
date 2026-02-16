import z from 'zod';

export const createTimeEntrySchema = z
  .object({
    sessionId: z.string().optional(),
    shiftId: z.string().optional(),
    volunteerId: z.string().optional(),
    status: z.string().optional(),
    startedAt: z.string().min(1, 'Start time is required'),
    endedAt: z.string().min(1, 'End time is required'),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.sessionId) return true;
      return data.shiftId && data.volunteerId;
    },
    {
      message: 'Please select a shift and volunteer',
      path: ['shiftId'],
    },
  );

export type CreateTimeEntryFormValues = z.infer<typeof createTimeEntrySchema>;
