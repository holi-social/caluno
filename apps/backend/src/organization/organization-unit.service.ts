import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { slugify } from '../utils';
import type { CreateOrganizationUnitInput } from './inputs/create-organization-unit.input';
import type { UpdateOrganizationUnitInput } from './inputs/update-organization-unit.input';
import type { OrganizationEntity } from './schemas/organization.schema';
import type { OrganizationUnitEntity } from './schemas/organization-unit.schema';
import type { OrganizationUnitTypeEntity } from './schemas/organization-unit-type.schema';

@Injectable()
export class OrganizationUnitService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { id },
    });
  }

  async findByOrganizationId(
    id: string,
    organizationId: string,
  ): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { organizationId, id },
    });
  }

  async findBySlug(
    slug: string,
    organizationId: string,
  ): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { organizationId, slug },
    });
  }

  async findAll(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<{ items: OrganizationUnitEntity[]; total: number }> {
    const items = await this.db.query.organizationUnits.findMany({
      where: { organizationId },
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(schema.organizationUnits)
      .where(eq(schema.organizationUnits.organizationId, organizationId));

    return { items, total };
  }

  async findOrganization(
    organizationId: string,
  ): Promise<OrganizationEntity | undefined> {
    return this.db.query.organizations.findFirst({
      where: { id: organizationId },
    });
  }

  async findType(
    typeId: string,
  ): Promise<OrganizationUnitTypeEntity | undefined> {
    return this.db.query.organizationUnitTypes.findFirst({
      where: { id: typeId },
    });
  }

  async findParent(
    organizationId: string,
    parentId: string,
  ): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { id: parentId, organizationId },
    });
  }

  async findChildren(
    organizationId: string,
    parentId: string,
  ): Promise<OrganizationUnitEntity[]> {
    return this.db.query.organizationUnits.findMany({
      where: { organizationId, parentId },
    });
  }

  async findRootByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { organizationId, isRoot: true },
    });
  }

  async create(
    organizationId: string,
    input: CreateOrganizationUnitInput,
  ): Promise<OrganizationUnitEntity> {
    const type = await this.findType(input.typeId);
    if (!type) {
      throw new NotFoundGraphQLError('Organization unit type not found');
    }

    const parent = await this.findParent(organizationId, input.parentId);
    if (!parent) {
      throw new NotFoundGraphQLError('Parent organization unit not found');
    }

    const slug = slugify(input.name);
    const existing = await this.findBySlug(organizationId, slug);
    if (existing) {
      throw new ConflictGraphQLError(
        `Organization unit slug "${slug}" already exists`,
      );
    }

    const [organizationUnit] = await this.db
      .insert(schema.organizationUnits)
      .values({
        ...input,
        organizationId,
        isRoot: false,
        slug,
      })
      .returning();

    return organizationUnit;
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateOrganizationUnitInput,
  ): Promise<OrganizationUnitEntity> {
    const unit = await this.findByOrganizationId(id, organizationId);
    if (!unit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    if (input.parentId === null) {
      throw new BadRequestGraphQLError(
        'parentId cannot be null for non-root organization units',
      );
    }

    if (input.parentId === id) {
      throw new BadRequestGraphQLError(
        'Organization unit cannot be its own parent',
      );
    }

    if (input.typeId) {
      const type = await this.findType(input.typeId);
      if (!type) {
        throw new NotFoundGraphQLError('Organization unit type not found');
      }
    }

    if (input.parentId) {
      const parent = await this.findParent(organizationId, input.parentId);
      if (!parent) {
        throw new NotFoundGraphQLError('Parent organization unit not found');
      }
    }

    let slug: string | undefined;
    if (input.name) {
      slug = slugify(input.name);
      const existing = await this.findBySlug(organizationId, slug);
      if (existing && existing.id !== id) {
        throw new ConflictGraphQLError(
          `Organization unit slug "${slug}" already exists`,
        );
      }
    }

    const [updated] = await this.db
      .update(schema.organizationUnits)
      .set({
        ...input,
        ...(slug ? { slug } : {}),
      })
      .where(
        and(
          eq(schema.organizationUnits.id, id),
          eq(schema.organizationUnits.organizationId, organizationId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    return updated;
  }

  async delete(
    id: string,
    organizationId: string,
  ): Promise<OrganizationUnitEntity> {
    const unit = await this.findByOrganizationId(id, organizationId);
    if (!unit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    if (unit.isRoot) {
      throw new ConflictGraphQLError(
        'Root organization unit cannot be deleted',
      );
    }

    const [deleted] = await this.db
      .delete(schema.organizationUnits)
      .where(
        and(
          eq(schema.organizationUnits.id, id),
          eq(schema.organizationUnits.organizationId, organizationId),
        ),
      )
      .returning();

    if (!deleted) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    return deleted;
  }
}
