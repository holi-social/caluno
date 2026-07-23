'use server';

import type { CreateShiftInput, UpdateShiftInput } from '@repo/data';
import { ShiftVisibility } from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { pickFirstShiftInstanceId } from './create-shift-flow';
import { generateRrule } from './rrule';
import { serverShiftDeleteSchema, serverShiftFormSchema } from './schemas';

export async function getShift(id: string, organizationUnitId: string) {
  const data = await getDataClient({ orgUId: organizationUnitId });
  return data.shift.findById(id);
}

export const createShift = actionClient
  .inputSchema(serverShiftFormSchema)
  .bindArgsSchemas([z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId] }) => {
    const data = await getDataClient({ orgUId });

    const rrule = generateRrule(
      parsedInput.startsAt,
      parsedInput.recurrenceDays,
      parsedInput.recurrenceEndsAt,
    );

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
      rrule,
      imageFileId: parsedInput.imageFileId ?? null,
    };

    const shift = await data.shift.create(input);
    const instances = await data.shift.findInstances(shift.id);

    return {
      id: shift.id,
      instanceId: pickFirstShiftInstanceId(instances),
    };
  });

export const updateShift = actionClient
  .inputSchema(serverShiftFormSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId, shiftId] }) => {
    const data = await getDataClient({ orgUId });

    const rrule = generateRrule(
      parsedInput.startsAt,
      parsedInput.recurrenceDays,
      parsedInput.recurrenceEndsAt,
    );

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
      rrule,
      imageFileId: parsedInput.imageFileId,
    };

    return await data.shift.update(shiftId, input);
  });

export const deleteShift = actionClient
  .inputSchema(serverShiftDeleteSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient({
      orgUId: parsedInput.organizationUnitId,
    });

    return await data.shift.delete(parsedInput.id);
  });

const updateShiftVolunteersSchema = z.object({
  memberIds: z.array(z.string()),
  inviteToAllInstances: z.boolean().optional(),
});

export const updateShiftVolunteers = actionClient
  .inputSchema(updateShiftVolunteersSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(
    async ({ parsedInput, bindArgsParsedInputs: [orgUId, instanceId] }) => {
      const data = await getDataClient({ orgUId });
      return await data.shift.updateMembers(instanceId, parsedInput.memberIds, {
        inviteToAllInstances: parsedInput.inviteToAllInstances,
      });
    },
  );

const updateShiftStaffingSchema = z.object({
  minVolunteers: z.number().int().positive().nullable(),
  maxVolunteers: z.number().int().positive().nullable(),
});

export const updateShiftStaffing = actionClient
  .inputSchema(updateShiftStaffingSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId, shiftId] }) => {
    const data = await getDataClient({ orgUId });
    await data.shift.update(shiftId, {
      minVolunteers: parsedInput.minVolunteers ?? undefined,
      maxVolunteers: parsedInput.maxVolunteers ?? undefined,
    });
  });
