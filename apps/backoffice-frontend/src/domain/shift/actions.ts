'use server';

import type { CreateShiftInput } from '@repo/data';
import { ShiftVisibility } from '@repo/data';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { createShiftSchema } from './schemas';

export const createShift = actionClient
  .inputSchema(createShiftSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationId);

    const input: CreateShiftInput = {
      title: parsedInput.name,
      startsAt: new Date(parsedInput.startsAt).toISOString(),
      endsAt: new Date(parsedInput.endsAt).toISOString(),
      instructions: parsedInput.instructions,
      location: parsedInput.location,
      visibility: parsedInput.openShift
        ? ShiftVisibility.AllMembers
        : ShiftVisibility.InvitedMembers,
      projectId: parsedInput.projectId,
      invitedMemberIds: parsedInput.invitedMemberIds,
    };

    return await data.shift.create(input);
  });
