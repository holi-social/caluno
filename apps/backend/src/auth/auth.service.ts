import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from 'src/database/database.module';
import { DATABASE_CONNECTION } from 'src/database/database-connection';
import * as schema from '../database/schema';
import { PermissionEntity, RoleEntity } from '../database/schema';
import { CreateRoleInput } from './inputs/create-role.input';
import { UpdateRoleInput } from './inputs/update-role.input';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async createRole(input: CreateRoleInput): Promise<RoleEntity> {
    const [role] = await this.db
      .insert(schema.roles)
      .values({
        name: input.name,
        description: input.description,
      })
      .returning();

    if (!role) {
      throw new Error('Failed to create role');
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
    organizationId: string,
  ): Promise<PermissionEntity[]> {
    const memberships = await this.db.query.memberships.findMany({
      where: { userId, organizationId },
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
    });

    return memberships.flatMap(
      (membership) =>
        membership.role?.permissions
          ?.map((rp) => rp.permission)
          .filter(
            (permission): permission is PermissionEntity => !!permission,
          ) ?? [],
    );
  }

  async hasRequiredPermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = await this.findUserPermissions(
      userId,
      organizationId,
    );

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
      where: {
        memberships: {
          organizationId,
        },
      },
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
