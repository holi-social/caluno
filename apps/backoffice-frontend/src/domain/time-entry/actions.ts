'use server';

import type { AddTimeEntryInput, StartVolunteerSessionInput } from '@repo/data';
import { VolunteerSessionStatus } from '@repo/data';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { createTimeEntrySchema } from './schemas';

export const createTimeEntry = actionClient
  .inputSchema(createTimeEntrySchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient();

    let sessionId = parsedInput.sessionId;

    // If no sessionId provided, create a new volunteer session first
    if (!sessionId && parsedInput.shiftId && parsedInput.volunteerId) {
      const sessionInput: StartVolunteerSessionInput = {
        shiftId: parsedInput.shiftId,
        volunteerId: parsedInput.volunteerId,
        status:
          (parsedInput.status as VolunteerSessionStatus) ||
          VolunteerSessionStatus.Submitted,
      };

      const newSession = await data.volunteerSession.start(sessionInput);
      sessionId = newSession.id;
    }

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const input: AddTimeEntryInput = {
      sessionId,
      startedAt: new Date(parsedInput.startedAt).toISOString(),
      endedAt: new Date(parsedInput.endedAt).toISOString(),
      notes: parsedInput.notes || null,
    };

    return await data.timeEntry.add(input);
  });
