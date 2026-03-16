import { Inject, Injectable } from '@nestjs/common';
import { count, eq, inArray } from 'drizzle-orm';
import {
  DEFAULT_MEMBER_ROLE_NAME,
  DEFAULT_OWNER_ROLE_NAME,
  MEMBER_DEFAULT_PERMISSIONS,
  PERMISSIONS,
} from '../auth/constants';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { OrganizationEntity } from '../database/schema';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { ProjectPaginatedResponse } from '../project/models/project.model';
import { ProjectService } from '../project/project.service';
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
    private readonly projectService: ProjectService,
    readonly _membershipService: MembershipService,
  ) {}

  async findById(id: string): Promise<Organization | null> {
    const organization = await this.db.query.organizations.findFirst({
      where: { id },
    });
    return this.mapper.toModel(organization);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const organization = await this.db.query.organizations.findFirst({
      where: { slug },
    });
    return this.mapper.toModel(organization);
  }

  async findAll(
    userId: string,
    pagination: PaginationInput,
  ): Promise<{ items: OrganizationEntity[]; total: number }> {
    const memberships = await this.db.query.memberships.findMany({
      where: { userId },
      with: {
        organization: true,
      },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, userId));

    const organizations = memberships
      .map((membership) => membership.organization)
      .filter(
        (organization): organization is OrganizationEntity =>
          organization !== null,
      );
    return {
      items: organizations,
      total,
    };
  }

  async findChildren(organizationId: string): Promise<Organization[]> {
    const children = await this.db.query.organizations.findMany({
      where: { parentId: organizationId },
    });
    return this.mapper.toArray(children);
  }

  async findParent(organizationId: string): Promise<Organization | null> {
    const parent = await this.db.query.organizations.findFirst({
      where: { id: organizationId },
    });
    return this.mapper.toModel(parent);
  }

  async findProjectsByOrganizationId(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<ProjectPaginatedResponse> {
    return this.projectService.findAllByOrganizationId(
      organizationId,
      pagination,
    );
  }

  async create(
    userId: string,
    input: CreateOrganizationInput,
  ): Promise<Organization> {
    const allPermissionKeys = Object.values(PERMISSIONS);

    const [organization] = await this.db.transaction(async (tx) => {
      const [createdOrganization] = await tx
        .insert(schema.organizations)
        .values({
          ...input,
          slug: slugify(input.name),
        })
        .returning();

      const [ownerRole] = await tx
        .insert(schema.roles)
        .values({
          name: DEFAULT_OWNER_ROLE_NAME,
          description: `Owner role for organization ${createdOrganization.name}`,
          isInternal: true,
        })
        .returning();

      const [memberRole] = await tx
        .insert(schema.roles)
        .values({
          name: DEFAULT_MEMBER_ROLE_NAME,
          description: `Member role for organization ${createdOrganization.name}`,
          isInternal: true,
        })
        .returning();

      const memberPermissionRows = await tx
        .select({
          id: schema.permissions.id,
          key: schema.permissions.key,
        })
        .from(schema.permissions)
        .where(inArray(schema.permissions.key, MEMBER_DEFAULT_PERMISSIONS));

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

      if (permissionRows.length > 0) {
        await tx.insert(schema.rolePermissions).values(
          permissionRows.map((permission) => ({
            roleId: ownerRole.id,
            permissionId: permission.id,
          })),
        );
      }

      await tx.insert(schema.memberships).values({
        userId,
        organizationId: createdOrganization.id,
        roleId: ownerRole.id,
      });

      return [createdOrganization];
    });

    return this.mapper.toModelOrThrow(organization);
  }
}
