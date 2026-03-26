'use server';

import type { CreateShiftInput, UpdateShiftInput } from '@repo/data';
import { ShiftVisibility } from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { shiftDeleteSchema, shiftFormSchema } from './schemas';

export const createShift = actionClient
  .inputSchema(shiftFormSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationId);

    const input: CreateShiftInput = {
      title: parsedInput.name,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      instructions: parsedInput.instructions,
      location: parsedInput.location,
      visibility: parsedInput.openShift
        ? ShiftVisibility.AllMembers
        : ShiftVisibility.InvitedMembers,
      invitedMemberIds: parsedInput.invitedMemberIds,
    };

    return await data.shift.create(input);
  });

export const updateShift = actionClient
  .inputSchema(shiftFormSchema)
  .inputSchema(async (prevSchema) => {
    return prevSchema.extend({ id: z.string().min(1, 'Shift ID is required') });
  })
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationId);

    const input: UpdateShiftInput = {
      title: parsedInput.name,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      instructions: parsedInput.instructions,
      location: parsedInput.location,
      visibility: parsedInput.openShift
        ? ShiftVisibility.AllMembers
        : ShiftVisibility.InvitedMembers,
      invitedMemberIds: parsedInput.invitedMemberIds,
    };

    return await data.shift.update(parsedInput.id, input);
  });

export const deleteShift = actionClient
  .inputSchema(shiftDeleteSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationId);

    return await data.shift.delete(parsedInput.id);
  });
