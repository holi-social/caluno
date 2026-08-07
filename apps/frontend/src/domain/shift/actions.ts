'use server';

import type {
  CreateShiftInput,
  UpdateShiftInput,
  UpdateShiftInstanceInput,
} from '@repo/data';
import { ShiftInviteStatus, ShiftVisibility } from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { pickFirstShiftInstanceId } from './create-shift-flow';
import { generateRrule } from './rrule';
import {
  serverEditShiftInstanceFormSchema,
  serverShiftDeleteSchema,
  serverShiftFormSchema,
} from './schemas';

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
      minVolunteers: parsedInput.minVolunteers ?? null,
      maxVolunteers: parsedInput.maxVolunteers ?? null,
      requiredFormIds: parsedInput.requiredFormIds,
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
      minVolunteers: parsedInput.minVolunteers ?? null,
      maxVolunteers: parsedInput.maxVolunteers ?? null,
      requiredFormIds: parsedInput.requiredFormIds,
    };

    return await data.shift.update(shiftId, input);
  });

export const updateShiftInstance = actionClient
  .inputSchema(serverEditShiftInstanceFormSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(
    async ({ parsedInput, bindArgsParsedInputs: [orgUId, instanceId] }) => {
      const data = await getDataClient({ orgUId });
      const applyToAllFuture = parsedInput.applyToAllFuture ?? false;

      const rrule = applyToAllFuture
        ? generateRrule(
            parsedInput.startsAt,
            parsedInput.recurrenceDays,
            parsedInput.recurrenceEndsAt,
          )
        : undefined;

      const input: UpdateShiftInstanceInput = {
        title: parsedInput.name,
        startsAt: parsedInput.startsAt.toISOString(),
        endsAt: parsedInput.endsAt.toISOString(),
        location: parsedInput.location,
        instructions: parsedInput.instructions,
        minVolunteers: parsedInput.minVolunteers ?? null,
        maxVolunteers: parsedInput.maxVolunteers ?? null,
        ...(applyToAllFuture
          ? {
              rrule,
              visibility: parsedInput.openShift
                ? ShiftVisibility.AllMembers
                : ShiftVisibility.InvitedMembers,
              ...(parsedInput.imageFileId !== undefined
                ? { imageFileId: parsedInput.imageFileId }
                : {}),
              requiredFormIds: parsedInput.requiredFormIds,
            }
          : {}),
      };

      return await data.shift.updateInstance(
        instanceId,
        input,
        applyToAllFuture,
      );
    },
  );

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

const updateShiftInstanceInviteStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(ShiftInviteStatus),
});

export const updateShiftInstanceInviteStatus = actionClient
  .inputSchema(updateShiftInstanceInviteStatusSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(
    async ({ parsedInput, bindArgsParsedInputs: [orgUId, instanceId] }) => {
      const data = await getDataClient({ orgUId });
      return await data.shift.updateShiftInstanceInviteStatus(
        instanceId,
        parsedInput.status,
        parsedInput.userId,
      );
    },
  );
