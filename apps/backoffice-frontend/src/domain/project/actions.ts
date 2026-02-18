'use server';

import type { CreateProjectInput, UpdateProjectInput } from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { createProjectSchema } from './schemas';

export const createProject = actionClient
  .inputSchema(createProjectSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationId);

    const input: CreateProjectInput = {
      title: parsedInput.title,
      description: parsedInput.description,
      organizationId: parsedInput.organizationId,
      location: parsedInput.location,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      status: parsedInput.status,
    };

    return await data.project.create(input);
  });

export const updateProject = actionClient
  .inputSchema(createProjectSchema)
  .bindArgsSchemas<[id: z.ZodUUID]>([z.uuid()])
  .action(async ({ bindArgsParsedInputs: [id], parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationId);

    const input: UpdateProjectInput = {
      title: parsedInput.title,
      description: parsedInput.description,
      location: parsedInput.location,
      organizationId: parsedInput.organizationId,
      startsAt: parsedInput.startsAt.toISOString(),
      endsAt: parsedInput.endsAt.toISOString(),
      status: parsedInput.status,
    };

    return await data.project.update(id, input);
  });
