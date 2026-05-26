import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import {
  OrganizationEntity,
  PermissionEntity,
  RoleEntity,
} from '../database/schema';
import { NotFoundGraphQLError } from '../graphql/errors';
import { OrganizationUnitService } from '../organization/organization-unit.service';
import { PERMISSION_GROUPS } from './constants/permission-groups';
import { CreateRoleInput } from './inputs/create-role.input';
import { UpdateRoleInput } from './inputs/update-role.input';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly organizationUnitService: OrganizationUnitService,
  ) {}

  async createRole(
    organizationUnitId: string,
    input: CreateRoleInput,
  ): Promise<RoleEntity> {
    const organization = await this.getOrganisation(organizationUnitId);

    const [role] = await this.db
      .insert(schema.roles)
      .values({
        name: input.name,
        description: input.description,
        organizationId: organization.id,
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

  private collectPermissions(
    membership: {
      roles: Array<{
        role: {
          permissions: Array<{ permission: PermissionEntity | null }>;
        } | null;
      }>;
    },
    permissionsById: Map<string, PermissionEntity>,
  ): void {
    for (const membershipRole of membership.roles) {
      if (!membershipRole.role) continue;
      for (const rolePermission of membershipRole.role.permissions) {
        if (rolePermission.permission) {
          permissionsById.set(
            rolePermission.permission.id,
            rolePermission.permission,
          );
        }
      }
    }
  }

  async findUserPermissions(
    userId: string,
    organizationUnitId: string,
  ): Promise<PermissionEntity[]> {
    const permissionsById = new Map<string, PermissionEntity>();
    const directMembership = await this.db.query.memberships.findFirst({
      where: { userId, organizationUnitId },
      with: {
        roles: {
          with: {
            role: {
              with: {
                permissions: { with: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (directMembership) {
      this.collectPermissions(directMembership, permissionsById);
      return Array.from(permissionsById.values());
    }

    const requestedUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { id: true, organizationId: true },
    });

    if (!requestedUnit?.organizationId) return [];

    const userMemberships = await this.db.query.memberships.findMany({
      where: { userId },
      with: {
        organizationUnit: { columns: { id: true, organizationId: true } },
        roles: {
          with: {
            role: {
              with: {
                permissions: { with: { permission: true } },
              },
            },
          },
        },
      },
    });

    const memberUnitIdsInOrg = new Set(
      userMemberships.flatMap((m) => {
        const unit = m.organizationUnit;
        if (!unit || unit.organizationId !== requestedUnit.organizationId)
          return [];
        return [unit.id];
      }),
    );

    if (memberUnitIdsInOrg.size === 0) return [];

    const units = await this.db.query.organizationUnits.findMany({
      where: { organizationId: requestedUnit.organizationId },
      columns: { id: true, parentId: true },
    });

    const parentByUnitId = new Map<string, string | null>();
    for (const unit of units) {
      parentByUnitId.set(unit.id, unit.parentId);
    }

    let currentUnitId: string | null = organizationUnitId;
    while (currentUnitId) {
      if (memberUnitIdsInOrg.has(currentUnitId)) {
        const membership = userMemberships.find(
          (m) => m.organizationUnit?.id === currentUnitId,
        );
        if (membership) {
          this.collectPermissions(membership, permissionsById);
        }
      }
      currentUnitId = parentByUnitId.get(currentUnitId) ?? null;
    }

    return Array.from(permissionsById.values());
  }

  async hasRequiredPermissions(
    userId: string,
    organizationUnitId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = await this.findUserPermissions(
      userId,
      organizationUnitId,
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

  async findPermissionGroups(): Promise<
    Array<{
      key: string;
      label: string;
      items: Array<{ label: string; permission: PermissionEntity }>;
    }>
  > {
    const permissions = await this.findAllPermissions();
    const permissionsByKey = new Map(
      permissions.map((permission) => [permission.key, permission]),
    );

    return PERMISSION_GROUPS.map((group) => ({
      key: group.key,
      label: group.label,
      items: group.permissions.map((item) => {
        const permission = permissionsByKey.get(item.key);
        if (!permission) {
          throw new Error(`Missing permission definition for ${item.key}`);
        }

        return {
          label: item.label,
          permission,
        };
      }),
    }));
  }

  async findAllRoles(organizationUnitId: string): Promise<RoleEntity[]> {
    const organization = await this.getOrganisation(organizationUnitId);

    return this.db.query.roles.findMany({
      where: { organizationId: organization.id },
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
      },
    });
  }

  async findRoleById(roleId: string): Promise<RoleEntity> {
    const role = await this.db.query.roles.findFirst({
      where: { id: roleId },
      with: {
        permissions: {
          with: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundGraphQLError(`Role not found`);
    }

    return role;
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

  async getOrganisation(
    organizationUnitId: string,
  ): Promise<OrganizationEntity> {
    const organization =
      await this.organizationUnitService.findOrganizationByUnitId(
        organizationUnitId,
      );

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }
}
