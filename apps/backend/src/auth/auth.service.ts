import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { PermissionEntity, RoleEntity } from '../database/schema';
import { CreateRoleInput } from './inputs/create-role.input';
import { UpdateRoleInput } from './inputs/update-role.input';

type PermissionScope = {
  organizationId?: string;
  organizationUnitId?: string;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async createOrganizationRole(
    organizationId: string,
    input: CreateRoleInput,
  ): Promise<RoleEntity> {
    const [role] = await this.db
      .insert(schema.roles)
      .values({
        name: input.name,
        description: input.description,
        organizationId,
      })
      .returning();

    if (!role) {
      throw new Error('Failed to create organization role');
    }

    if (input.permissionIds.length) {
      await this.db.insert(schema.rolePermissions).values(
        input.permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      );
    }

    return role;
  }

  async createOrganizationUnitRole(
    organizationUnitId: string,
    input: CreateRoleInput,
  ): Promise<RoleEntity> {
    const [role] = await this.db
      .insert(schema.roles)
      .values({
        name: input.name,
        description: input.description,
        organizationUnitId,
      })
      .returning();

    if (!role) {
      throw new Error('Failed to create organization unit role');
    }

    if (input.permissionIds.length) {
      await this.db.insert(schema.rolePermissions).values(
        input.permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      );
    }

    return role;
  }

  async findUserPermissions(
    userId: string,
    scope: PermissionScope,
  ): Promise<PermissionEntity[]> {
    if (!scope.organizationId && !scope.organizationUnitId) {
      return [];
    }

    const membershipQueries: Promise<
      Array<{
        role:
          | {
              permissions:
                | Array<{ permission: PermissionEntity | null }>
                | null;
            }
          | null;
      }>
    >[] = [];

    if (scope.organizationId) {
      membershipQueries.push(
        this.db.query.memberships.findMany({
          where: { userId, role: { organizationId: scope.organizationId } },
          with: {
            role: {
              with: {
                permissions: {
                  with: {
                    permission: true,
                  },
                },
              },
            },
          },
        }),
      );
    }

    if (scope.organizationUnitId) {
      membershipQueries.push(
        this.db.query.memberships.findMany({
          where: {
            userId,
            role: { organizationUnitId: scope.organizationUnitId },
          },
          with: {
            role: {
              with: {
                permissions: {
                  with: {
                    permission: true,
                  },
                },
              },
            },
          },
        }),
      );
    }

    const membershipsByScope = await Promise.all(membershipQueries);
    const permissions = membershipsByScope.flatMap((memberships) =>
      memberships.flatMap(
        (membership) =>
          membership.role?.permissions
            ?.map((rp) => rp.permission)
            .filter(
              (permission): permission is PermissionEntity => !!permission,
            ) ?? [],
      ),
    );

    const uniquePermissions = new Map<string, PermissionEntity>();
    for (const permission of permissions) {
      uniquePermissions.set(permission.id, permission);
    }

    return [...uniquePermissions.values()];
  }

  async hasRequiredPermissions(
    userId: string,
    scope: PermissionScope,
    requiredPermissions: string[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    if (!scope.organizationId && !scope.organizationUnitId) {
      throw new BadRequestException(
        'Missing scope. organizationId or organizationUnitId is required',
      );
    }

    const userPermissions = await this.findUserPermissions(userId, scope);

    const permissionKeys = new Set(
      userPermissions.map((permission) => permission.key),
    );

    return requiredPermissions.every((permission) =>
      permissionKeys.has(permission),
    );
  }

  async findAllPermissions(): Promise<PermissionEntity[]> {
    return await this.db.query.permissions.findMany();
  }

  async findAllRoles(organizationId: string): Promise<RoleEntity[]> {
    return this.db.query.roles.findMany({
      where: { organizationId },
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
      },
    });
  }

  async findRolePermissions(roleId: string): Promise<PermissionEntity[]> {
    const rolePermissions = await this.db.query.rolePermissions.findMany({
      where: { roleId },
      with: {
        permission: true,
      },
    });

    return rolePermissions
      .map((rp) => rp.permission)
      .filter((p): p is PermissionEntity => p !== null);
  }

  async updateRole(
    roleId: string,
    input: UpdateRoleInput,
  ): Promise<RoleEntity> {
    const [updatedRole] = await this.db.transaction(async (tx) => {
      const updateData: Partial<typeof schema.roles.$inferInsert> = {};

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      const [role] = await tx
        .update(schema.roles)
        .set(updateData)
        .where(eq(schema.roles.id, roleId))
        .returning();

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      if (input.permissionIds !== undefined) {
        await tx
          .delete(schema.rolePermissions)
          .where(eq(schema.rolePermissions.roleId, roleId));

        if (input.permissionIds.length) {
          await tx.insert(schema.rolePermissions).values(
            input.permissionIds.map((permissionId) => ({
              roleId,
              permissionId,
            })),
          );
        }
      }

      return [role];
    });

    return updatedRole;
  }

  async deleteRole(roleId: string): Promise<RoleEntity> {
    const [deletedRole] = await this.db.transaction(async (tx) => {
      const assignedMembership = await tx.query.memberships.findFirst({
        where: {
          roleId,
        },
      });

      if (assignedMembership) {
        throw new BadRequestException(
          'Role is assigned to at least one membership and cannot be deleted',
        );
      }

      const [role] = await tx
        .delete(schema.roles)
        .where(eq(schema.roles.id, roleId))
        .returning();

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      return [role];
    });

    return deletedRole;
  }
}
