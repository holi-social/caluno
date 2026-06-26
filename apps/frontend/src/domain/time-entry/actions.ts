'use server';

import type {
  AddTimeEntryInput,
  CloseTimeEntryInput,
  UpdateTimeEntryInput,
} from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import {
  serverCloseTimeEntrySchema,
  serverDeleteTimeEntrySchema,
  serverTimeEntrySchema,
} from './schemas';

export const createTimeEntry = actionClient
  .inputSchema(serverTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: AddTimeEntryInput = {
      shiftInstanceId: parsedInput.shiftInstanceId,
      volunteerId: parsedInput.volunteerId,
      startedAt: parsedInput.startedAt.toISOString(),
      endedAt: parsedInput.endedAt ? parsedInput.endedAt?.toISOString() : null,
      notes: parsedInput.notes || null,
    };

    return await data.timeEntry.add(input);
  });

export const closeTimeEntry = actionClient
  .inputSchema(serverCloseTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: CloseTimeEntryInput = {
      endedAt: parsedInput.endedAt.toISOString(),
      notes: parsedInput.notes,
    };

    return await data.timeEntry.close(parsedInput.id, input);
  });

export const updateTimeEntry = actionClient
  .inputSchema(serverTimeEntrySchema)
  .bindArgsSchemas([z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [timeEntryId] }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: UpdateTimeEntryInput = {
      shiftInstanceId: parsedInput.shiftInstanceId,
      startedAt: parsedInput.startedAt.toISOString(),
      endedAt: parsedInput.endedAt?.toISOString() ?? null,
      notes: parsedInput.notes || null,
    };

    return await data.timeEntry.update(timeEntryId, input);
  });

export const deleteTimeEntry = actionClient
  .inputSchema(serverDeleteTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);
    return await data.timeEntry.delete(parsedInput.id);
  });
