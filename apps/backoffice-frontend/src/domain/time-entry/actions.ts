'use server';

import type { AddTimeEntryInput } from '@repo/data';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { createTimeEntrySchema } from './schemas';

export const createTimeEntry = actionClient
  .inputSchema(createTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient();

    const input: AddTimeEntryInput = {
      shiftId: parsedInput.shiftId,
      volunteerId: parsedInput.volunteerId,
      startedAt: new Date(parsedInput.startedAt).toISOString(),
      endedAt: new Date(parsedInput.endedAt).toISOString(),
      notes: parsedInput.notes || null,
    };

    return await data.timeEntry.add(input);
  });
