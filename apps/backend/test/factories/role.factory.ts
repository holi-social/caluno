import { type Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';

type RoleEntity = typeof schema.roles.$inferSelect;
type PermissionEntity = typeof schema.permissions.$inferSelect;

export const createRole = async (
  db: Database,
  args: { organizationId: string; name?: string },
): Promise<RoleEntity> => {
  const [role] = await db
    .insert(schema.roles)
    .values({
      organizationId: args.organizationId,
      name: args.name ?? `role-${crypto.randomUUID()}`,
    })
    .returning();
  if (!role) throw new Error('Failed to create role');
  return role;
};

export const createPermission = async (
  db: Database,
  args: { key?: string },
): Promise<PermissionEntity> => {
  const [permission] = await db
    .insert(schema.permissions)
    .values({ key: args.key ?? `perm-${crypto.randomUUID()}` })
    .returning();
  if (!permission) throw new Error('Failed to create permission');
  return permission;
};

export const grantPermissionToRole = async (
  db: Database,
  args: { roleId: string; permissionId: string },
): Promise<void> => {
  await db.insert(schema.rolePermissions).values({
    roleId: args.roleId,
    permissionId: args.permissionId,
  });
};

export const assignRoleToMembership = async (
  db: Database,
  args: { membershipId: string; roleId: string },
): Promise<void> => {
  await db.insert(schema.membershipRoles).values({
    membershipId: args.membershipId,
    roleId: args.roleId,
  });
};
