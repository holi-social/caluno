'use server';

import type { CreateProjectInput } from '@repo/data';
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
