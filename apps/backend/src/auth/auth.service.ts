import { Inject, Injectable } from '@nestjs/common';
import type { Database } from 'src/database/database.module';
import { DATABASE_CONNECTION } from 'src/database/database-connection';
import * as schema from '../database/schema';
import {
  PermissionEntity,
  RoleEntity,
  RolePermissionEntity,
} from '../database/schema';
import { CreateRoleInput } from './inputs/create-role.input';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async createRole(input: CreateRoleInput): Promise<RolePermissionEntity[]> {
    const rolePermissions = await this.db.transaction(async (tx) => {
      const [role] = await tx
        .insert(schema.roles)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning();

      if (!role) {
        throw new Error('Failed to create role');
      }

      if (!input.permissionIds.length) {
        return [] as RolePermissionEntity[];
      }

      const createdRolePermissions = await tx
        .insert(schema.rolePermissions)
        .values(
          input.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        )
        .returning();

      return createdRolePermissions;
    });

    return rolePermissions;
  }

  async getUserPermissions(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const userPermissions = await this.db.query.memberships.findMany({
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
    return Array.from(
      new Set(
        userPermissions.flatMap(
          (membership) =>
            membership.role?.permissions
              ?.map((rp) => rp.permission?.key)
              .filter((key): key is string => !!key) ?? [],
        ),
      ),
    );
  }

  async hasRequiredPermissions(
    userId: string,
    organizationId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(
      userId,
      organizationId,
    );

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
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
}
