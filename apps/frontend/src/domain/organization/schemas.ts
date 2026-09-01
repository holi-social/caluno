import z from 'zod';

export const updateOrganizationSchema = z.object({
  organizationId: z.string().min(1),
  organizationUnitId: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  contactEmail: z.string().optional(),
  phone: z.string().optional(),
  websiteUrl: z.string().optional(),
  logoUrl: z.string().nullish(),
});

export type UpdateOrganizationFormValues = z.infer<
  typeof updateOrganizationSchema
>;
