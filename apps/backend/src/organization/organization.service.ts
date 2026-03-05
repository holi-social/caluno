import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { OrganizationEntity } from '../database/schema';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { ProjectPaginatedResponse } from '../project/models/project.model';
import { ProjectService } from '../project/project.service';
import { User } from '../user/models/user.model';
import { slugify } from '../utils';
import { OrganizationRole } from './enums';
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
    private readonly membershipService: MembershipService,
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

  async findAdmins(organizationId: string): Promise<UserEntity[]> {
    return this.membershipService.findUsersByRole(
      organizationId,
      OrganizationRole.ADMIN,
    );
  }

  async findVolunteers(organizationId: string): Promise<User[]> {
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
      })
      .returning();

    await this.membershipService.create(
      userId,
      organization.id,
      OrganizationRole.ADMIN,
    );

    return this.mapper.toModelOrThrow(organization);
  }
}
