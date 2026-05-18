import z from 'zod';

export const roleSchema = z.object({
  organizationUnitId: z.uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, 'At least one permission required'),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
