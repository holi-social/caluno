'use server';

import type {
  CreateEventInput,
  CreateShiftInput,
  UpdateEventInput,
} from '@repo/data';
import { EventInviteStatus, ShiftVisibility } from '@repo/data';
import { revalidatePath } from 'next/cache';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { pickFirstShiftInstanceId } from '../shift/create-shift-flow';
import { generateRrule } from '../shift/rrule';
import { serverShiftFormSchema } from '../shift/schemas';
import { serverEventFormSchema, serverEventInviteFormSchema } from './schemas';

export const createEvent = actionClient
  .inputSchema(serverEventFormSchema)
  .bindArgsSchemas([z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId] }) => {
    const data = await getDataClient({ orgUId });

    const input: CreateEventInput = {
      title: parsedInput.title,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      location: parsedInput.location,
      logoFileId: parsedInput.logoFileId ?? null,
      coverFileId: parsedInput.coverFileId ?? null,
      requiredFormIds: parsedInput.requiredFormIds,
    };

    const result = await data.event.create(input);

    revalidatePath(`/admin/${orgUId}/events`);

    return result;
  });

export const updateEvent = actionClient
  .inputSchema(serverEventFormSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId, eventId] }) => {
    const data = await getDataClient({ orgUId });

    const input: UpdateEventInput = {
      title: parsedInput.title,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      location: parsedInput.location,
      logoFileId: parsedInput.logoFileId,
      coverFileId: parsedInput.coverFileId,
      requiredFormIds: parsedInput.requiredFormIds,
    };

    const result = await data.event.update(eventId, input);

    revalidatePath(`/admin/${orgUId}/events`);
    revalidatePath(`/admin/${orgUId}/events/${eventId}`);

    return result;
  });

export const inviteMembersToEvent = actionClient
  .inputSchema(serverEventInviteFormSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId, eventId] }) => {
    const data = await getDataClient({ orgUId });
    const result = await data.event.inviteMembers(
      eventId,
      parsedInput.memberIds,
    );

    revalidatePath(`/admin/${orgUId}/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/');

    return result;
  });

const updateEventInviteStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(EventInviteStatus),
});

export const updateEventInviteStatus = actionClient
  .inputSchema(updateEventInviteStatusSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId, eventId] }) => {
    const data = await getDataClient({ orgUId });
    const result = await data.event.updateEventInviteStatus(
      eventId,
      parsedInput.status,
      parsedInput.userId,
    );

    revalidatePath(`/admin/${orgUId}/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/');

    return result;
  });

export const deleteEvent = actionClient
  .inputSchema(z.object({}))
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ bindArgsParsedInputs: [orgUId, eventId] }) => {
    const data = await getDataClient({ orgUId });
    const result = await data.event.delete(eventId);

    revalidatePath(`/admin/${orgUId}/events`);

    return result;
  });

export const createEventShift = actionClient
  .inputSchema(serverShiftFormSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId, eventId] }) => {
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
      eventId,
      requiredFormIds: parsedInput.requiredFormIds,
    };

    const shift = await data.shift.create(input);
    const instances = await data.shift.findInstances(shift.id);

    return {
      id: shift.id,
      instanceId: pickFirstShiftInstanceId(instances),
    };
  });
