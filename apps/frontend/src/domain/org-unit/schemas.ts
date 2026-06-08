import z from 'zod';

export const createOrgUnitSchema = z.object({
  organizationId: z.uuid(),
  organizationUnitId: z.uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  typeId: z.uuid('Organization unit type is required'),
  logoUrl: z.union([z.url(), z.literal('')]).optional(),
  websiteUrl: z.union([z.url(), z.literal('')]).optional(),
  contactEmail: z.union([z.email(), z.literal('')]).optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
});

export const deleteOrgUnitSchema = z.object({
  id: z.uuid(),
  organizationUnitId: z.uuid(),
});

export type CreateOrgUnitFormValues = z.infer<typeof createOrgUnitSchema>;
export type DeleteOrgUnitFormValues = z.infer<typeof deleteOrgUnitSchema>;
