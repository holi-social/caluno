'use server';

import type { AddTimeEntryInput, CloseTimeEntryInput } from '@repo/data';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { closeTimeEntrySchema, createTimeEntrySchema } from './schemas';

export const createTimeEntry = actionClient
  .inputSchema(createTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient();

    const input: AddTimeEntryInput = {
      shiftId: parsedInput.shiftId,
      volunteerId: parsedInput.volunteerId,
      startedAt: new Date(parsedInput.startedAt).toISOString(),
      endedAt: parsedInput.endedAt
        ? new Date(parsedInput.endedAt).toISOString()
        : null,
      notes: parsedInput.notes || null,
    };

    return await data.timeEntry.add(input);
  });

export const closeTimeEntry = actionClient
  .inputSchema(closeTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: CloseTimeEntryInput = {
      endedAt: parsedInput.endedAt.toISOString(),
      notes: parsedInput.notes,
    };

    return await data.timeEntry.close(parsedInput.id, input);
  });
