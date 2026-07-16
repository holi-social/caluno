'use server';

import type { CreateEventInput, UpdateEventInput } from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
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
    };

    return await data.event.create(input);
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
    };

    return await data.event.update(eventId, input);
  });

export const inviteMembersToEvent = actionClient
  .inputSchema(serverEventInviteFormSchema)
  .bindArgsSchemas([z.string(), z.string()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [orgUId, eventId] }) => {
    const data = await getDataClient({ orgUId });

    return await data.event.inviteMembers(eventId, parsedInput.memberIds);
  });
