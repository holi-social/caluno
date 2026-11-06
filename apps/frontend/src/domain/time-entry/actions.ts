'use server';

import type { AddTimeEntryInput, UpdateTimeEntryInput } from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import {
  serverCheckInVolunteerSchema,
  serverCheckOutVolunteerSchema,
  serverDeleteTimeEntrySchema,
  serverTimeEntrySchema,
} from './schemas';

export const createTimeEntry = actionClient
  .inputSchema(serverTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });

    const input: AddTimeEntryInput = {
      shiftInstanceId: parsedInput.shiftInstanceId,
      volunteerId: parsedInput.volunteerId,
      startedAt: parsedInput.startedAt.toISOString(),
      endedAt: parsedInput.endedAt ? parsedInput.endedAt?.toISOString() : null,
      notes: parsedInput.notes || null,
    };

    return await data.timeEntry.add(input);
  });

export const updateTimeEntry = actionClient
  .inputSchema(serverTimeEntrySchema)
  .bindArgsSchemas([z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [timeEntryId] }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });

    const input: UpdateTimeEntryInput = {
      shiftInstanceId: parsedInput.shiftInstanceId ?? null,
      startedAt: parsedInput.startedAt.toISOString(),
      endedAt: parsedInput.endedAt?.toISOString() ?? null,
      notes: parsedInput.notes || null,
    };

    return await data.timeEntry.update(timeEntryId, input);
  });

export const deleteTimeEntry = actionClient
  .inputSchema(serverDeleteTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    return await data.timeEntry.delete(parsedInput.id);
  });

export const checkInVolunteer = actionClient
  .inputSchema(serverCheckInVolunteerSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });

    return await data.timeEntry.checkInVolunteer(
      parsedInput.volunteerId,
      parsedInput.shiftInstanceId,
    );
  });

export const checkOutVolunteer = actionClient
  .inputSchema(serverCheckOutVolunteerSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });
    return await data.timeEntry.checkOutVolunteer(parsedInput.timeEntryId);
  });
