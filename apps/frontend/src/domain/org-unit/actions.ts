'use server';

import type {
  CreateOrganizationUnitInput,
  UpdateOrganizationUnitInput,
} from '@repo/data';
import z from 'zod';
import { getDataClient } from '@/lib/data-client';
import { actionClient } from '@/lib/safe-action';
import { deleteOrgUnitSchema, serverCreateOrgUnitSchema } from './schemas';

export const createOrgUnit = actionClient
  .inputSchema(serverCreateOrgUnitSchema)
  .bindArgsSchemas<[parentId: z.ZodUUID]>([z.uuid()])
  .action(async ({ bindArgsParsedInputs: [parentId], parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: CreateOrganizationUnitInput = {
      organizationId: parsedInput.organizationId,
      parentId: parentId,
      name: parsedInput.name,
      typeId: parsedInput.typeId,
      logoUrl: parsedInput.logoUrl || null,
      websiteUrl: parsedInput.websiteUrl || null,
      contactEmail: parsedInput.contactEmail || null,
      phone: parsedInput.phone || null,
      description: parsedInput.description || null,
      address: parsedInput.address || null,
    };

    return await data.organizationUnit.create(input);
  });

export const updateOrgUnit = actionClient
  .inputSchema(serverCreateOrgUnitSchema)
  .bindArgsSchemas<[id: z.ZodUUID]>([z.uuid()])
  .action(async ({ bindArgsParsedInputs: [id], parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);

    const input: UpdateOrganizationUnitInput = {
      organizationId: parsedInput.organizationId,
      name: parsedInput.name,
      typeId: parsedInput.typeId,
      logoUrl: parsedInput.logoUrl || null,
      websiteUrl: parsedInput.websiteUrl || null,
      contactEmail: parsedInput.contactEmail || null,
      phone: parsedInput.phone || null,
      description: parsedInput.description || null,
      address: parsedInput.address || null,
    };

    return await data.organizationUnit.update(id, input);
  });

export const deleteOrgUnit = actionClient
  .inputSchema(deleteOrgUnitSchema)
  .action(async ({ parsedInput }) => {
    const data = await getDataClient(parsedInput.organizationUnitId);
    return await data.organizationUnit.delete(parsedInput.id);
  });
