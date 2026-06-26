import z from 'zod';

interface RoleSchemaMessages {
  nameMin: string;
  permissionsRequired: string;
}

export function roleSchema(t: RoleSchemaMessages) {
  return z.object({
    organizationUnitId: z.uuid(),
    name: z.string().min(2, t.nameMin),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).min(1, t.permissionsRequired),
  });
}

export const serverRoleSchema = roleSchema({
  nameMin: 'Name must be at least 2 characters',
  permissionsRequired: 'At least one permission required',
});

export type RoleFormValues = z.infer<typeof serverRoleSchema>;
