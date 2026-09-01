import z from 'zod';

interface OrgUnitSchemaMessages {
  nameMin: string;
  typeRequired: string;
}

export function createOrgUnitSchema(t: OrgUnitSchemaMessages) {
  return z.object({
    organizationId: z.uuid(),
    organizationUnitId: z.uuid(),
    name: z.string().min(2, t.nameMin),
    typeId: z.uuid(t.typeRequired),
    logoFileId: z.uuid().nullish(),
    websiteUrl: z.union([z.url(), z.literal('')]).optional(),
    contactEmail: z.union([z.email(), z.literal('')]).optional(),
    phone: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
  });
}

// Static instance for server-side action validation.
export const serverCreateOrgUnitSchema = createOrgUnitSchema({
  nameMin: 'Name must be at least 2 characters',
  typeRequired: 'Organization unit type is required',
});

export const deleteOrgUnitSchema = z.object({
  id: z.uuid(),
  organizationUnitId: z.uuid(),
});

export type CreateOrgUnitFormValues = z.infer<typeof serverCreateOrgUnitSchema>;
export type DeleteOrgUnitFormValues = z.infer<typeof deleteOrgUnitSchema>;
