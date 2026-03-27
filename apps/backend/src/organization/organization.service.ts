import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import {
  DEFAULT_MEMBER_ROLE_NAME,
  DEFAULT_OWNER_ROLE_NAME,
  MEMBER_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../auth/constants';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { OrganizationEntity, OrganizationUnitEntity } from '../database/schema';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import { slugify } from '../utils';
import type { CreateOrganizationInput } from './inputs/create-organization.input';
import { OrganizationMapper } from './mappers/organization.mapper';
import { type Organization } from './models/organization.model';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly mapper: OrganizationMapper,
  ) {}

  async findById(id: string): Promise<OrganizationEntity | undefined> {
    return this.db.query.organizations.findFirst({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | undefined> {
    return this.db.query.organizations.findFirst({
      where: { slug },
    });
  }

  async findAll(
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ items: OrganizationEntity[]; total: number }> {
    const memberships = await this.db.query.memberships.findMany({
      where: { userId },
      with: {
        role: {
          with: {
            organization: true,
          },
        },
      },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.memberships)
      .innerJoin(
        schema.roles,
        eq(schema.memberships.roleId, schema.roles.id),
      )
      .where(
        and(
          eq(schema.memberships.userId, userId),
          isNotNull(schema.roles.organizationId),
          isNull(schema.roles.organizationUnitId),
        ),
      );

    const organizations = memberships
      .map((membership) => membership.role?.organization)
      .filter(
        (organization): organization is OrganizationEntity =>
          organization !== null,
      );

    return {
      items: organizations,
      total,
    };
  }

  async findRootUnit(
    organizationId: string,
  ): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { organizationId, isRoot: true },
    });
  }

  async findChildrenUnits(
    organizationId: string,
  ): Promise<OrganizationUnitEntity[]> {
    return this.db.query.organizationUnits.findMany({
      where: { organizationId, isRoot: false },
    });
  }

  async create(
    userId: string,
    input: CreateOrganizationInput,
  ): Promise<Organization> {
    const allPermissionKeys = Object.values(PERMISSIONS);

    const [organization] = await this.db.transaction(async (tx) => {
      // Create organization first to get the canonical base data.
      const [createdOrganization] = await tx
        .insert(schema.organizations)
        .values({
          ...input,
          slug: slugify(input.name),
        })
        .returning();

      // Create the default root unit type.
      const [rootType] = await tx
        .insert(schema.organizationUnitTypes)
        .values({
          name: 'management',
          description: `organization managment unit for ${createdOrganization.name}`,
          icon: 'building-2',
        })
        .returning();

      // Create root unit mirroring organization fields.
      await tx.insert(schema.organizationUnits).values({
        organizationId: createdOrganization.id,
        parentId: null,
        typeId: rootType.id,
        isRoot: true,
        name: createdOrganization.name,
        slug: createdOrganization.slug,
        logoUrl: createdOrganization.logoUrl,
        websiteUrl: createdOrganization.websiteUrl,
        email: createdOrganization.email,
        phone: createdOrganization.phone,
        description: createdOrganization.description,
        address: createdOrganization.address,
      });

      const [ownerRole] = await tx
        .insert(schema.roles)
        .values({
          name: DEFAULT_OWNER_ROLE_NAME,
          description: `Owner role for organization ${createdOrganization.name}`,
          isInternal: true,
          organizationId: createdOrganization.id,
        })
        .returning();

      // Create the default member role.
      const [memberRole] = await tx
        .insert(schema.roles)
        .values({
          name: DEFAULT_MEMBER_ROLE_NAME,
          description: `Member role for organization ${createdOrganization.name}`,
          isInternal: true,
          organizationId: createdOrganization.id,
        })
        .returning();

      const memberPermissionRows = await tx
        .select({
          id: schema.permissions.id,
          key: schema.permissions.key,
        })
        .from(schema.permissions)
        .where(inArray(schema.permissions.key, MEMBER_DEFAULT_PERMISSIONS));

      // Attach default member permissions.
      await tx.insert(schema.rolePermissions).values(
        memberPermissionRows.map((permission) => ({
          roleId: memberRole.id,
          permissionId: permission.id,
        })),
      );

      const permissionRows = await tx
        .select({
          id: schema.permissions.id,
          key: schema.permissions.key,
        })
        .from(schema.permissions)
        .where(inArray(schema.permissions.key, allPermissionKeys));

      // Attach all permissions to the owner role.
      if (permissionRows.length > 0) {
        await tx.insert(schema.rolePermissions).values(
          permissionRows.map((permission) => ({
            roleId: ownerRole.id,
            permissionId: permission.id,
          })),
        );
      }

      // Link creator as owner member of the organization.
      await tx.insert(schema.memberships).values({
        userId,
        roleId: ownerRole.id,
      });

      return [createdOrganization];
    });

    return this.mapper.toModelOrThrow(organization);
  }
}
