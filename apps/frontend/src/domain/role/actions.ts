'use server';

import type { CreateRoleInput } from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { serverRoleSchema } from './schemas';

export const createRole = actionClient
  .inputSchema(serverRoleSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: CreateRoleInput = {
      name: parsedInput.name,
      description: parsedInput.description,
      permissionIds: parsedInput.permissionIds,
    };

    return await data.role.create(input);
  });

export const updateRole = actionClient
  .inputSchema(serverRoleSchema)
  .bindArgsSchemas<[id: z.ZodUUID]>([z.uuid()])
  .action(async ({ bindArgsParsedInputs: [id], parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: CreateRoleInput = {
      name: parsedInput.name,
      description: parsedInput.description,
      permissionIds: parsedInput.permissionIds,
    };

    return await data.role.update(id, input);
  });

export const deleteRole = actionClient
  .inputSchema(
    z.object({
      id: z.uuid(),
      organizationUnitId: z.uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);
    return await data.role.delete(parsedInput.id);
  });
