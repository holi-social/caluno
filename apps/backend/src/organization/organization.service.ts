import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { UserEntity } from '../auth/schemas/auth.schema';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { ProjectPaginatedResponse } from '../project/models/project.model';
import { ProjectService } from '../project/project.service';
import { UserService } from '../user/user.service';
import { slugify } from '../utils';
import { OrganizationRole } from './enums';
import type { CreateOrganizationInput } from './inputs/create-organization.input';
import { OrganizationMapper } from './mappers/organization.mapper';
import {
  type Organization,
  OrganizationPaginatedResponse,
} from './models/organization.model';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly mapper: OrganizationMapper,
    private readonly userService: UserService,
    private readonly projectService: ProjectService,
    private readonly membershipService: MembershipService,
  ) {}

  async findById(id: string): Promise<Organization | null> {
    const organization = await this.db.query.organizations.findFirst({
      where: eq(schema.organizations.id, id),
    });
    return this.mapper.toModel(organization);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const organization = await this.db.query.organizations.findFirst({
      where: eq(schema.organizations.slug, slug),
    });
    return this.mapper.toModel(organization);
  }

  async findAll(
    pagination: PaginationInput,
  ): Promise<OrganizationPaginatedResponse> {
    const organizations = await this.db.query.organizations.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return new OrganizationPaginatedResponse({
      items: this.mapper.toArray(organizations),
      total: organizations.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  async findChildren(organizationId: string): Promise<Organization[]> {
    const children = await this.db.query.organizations.findMany({
      where: eq(schema.organizations.parentId, organizationId),
    });
    return this.mapper.toArray(children);
  }

  async findParent(organizationId: string): Promise<Organization | null> {
    const parent = await this.db.query.organizations.findFirst({
      where: eq(schema.organizations.id, organizationId),
    });
    return this.mapper.toModel(parent);
  }

  async findOwner(ownerId: string): Promise<UserEntity> {
    return this.userService.findByIdOrThrow(ownerId);
  }

  async findAdmins(organizationId: string): Promise<UserEntity[]> {
    return this.membershipService.findUsersByRole(
      organizationId,
      OrganizationRole.ADMIN,
    );
  }

  async findVolunteers(organizationId: string): Promise<UserEntity[]> {
    return this.membershipService.findUsersByRole(
      organizationId,
      OrganizationRole.VOLUNTEER,
    );
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
    const [organization] = await this.db
      .insert(schema.organizations)
      .values({
        ...input,
        slug: slugify(input.name),
        ownerId: userId,
      })
      .returning();

    await this.membershipService.create(
      userId,
      organization.id,
      OrganizationRole.OWNER,
    );

    return this.mapper.toModelOrThrow(organization);
  }
}
