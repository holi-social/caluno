import z from 'zod';

export const createRoleSchema = z.object({
  organizationUnitId: z.uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).min(1, 'Select at least one permission'),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
