import z from 'zod';

/**
 * The organization profile edited in Settings. It lives on the org's root
 * unit, the same record the overview edits and accounting documents read.
 */
export const updateOrganizationSchema = z.object({
  organizationId: z.string().min(1),
  organizationUnitId: z.string().min(1),
  rootUnitId: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  legalRep: z.string().optional(),
  contactEmail: z.string().optional(),
  phone: z.string().optional(),
  websiteUrl: z.string().optional(),
  /**
   * Not edited here, only carried through: the organization row's logo is
   * still read elsewhere (e.g. the join header), so the profile save must not
   * drop it.
   */
  logoUrl: z.string().nullish(),
});

export type UpdateOrganizationFormValues = z.infer<
  typeof updateOrganizationSchema
>;
