import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, isNull } from 'drizzle-orm';
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

  async findBySlug(slug: string): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { slug },
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
      .where(
        and(
          eq(schema.organizationUnits.organizationId, organizationId),
          isNull(schema.organizationUnits.deletedAt),
        ),
      );

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
    parentId: string,
  ): Promise<OrganizationUnitEntity | undefined> {
    return this.db.query.organizationUnits.findFirst({
      where: { id: parentId },
    });
  }

  async findChildren(parentId: string): Promise<OrganizationUnitEntity[]> {
    return this.db
      .select()
      .from(schema.organizationUnits)
      .where(
        and(
          eq(schema.organizationUnits.parentId, parentId),
          isNull(schema.organizationUnits.deletedAt),
        ),
      );
  }

  async findOrganizationByUnitId(
    organizationUnitId: string,
  ): Promise<OrganizationEntity | undefined> {
    const organizationUnit = await this.findById(organizationUnitId);
    if (!organizationUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }
    return this.findOrganization(organizationUnit.organizationId);
  }

  async create(
    input: CreateOrganizationUnitInput,
  ): Promise<OrganizationUnitEntity> {
    const type = await this.findType(input.typeId);
    if (!type) {
      throw new NotFoundGraphQLError('Organization unit type not found');
    }

    const parent = await this.findParent(input.parentId);

    if (!parent) {
      throw new NotFoundGraphQLError('Parent organization unit not found');
    }

    const slug = slugify(input.name);
    const existing = await this.findBySlug(slug);
    if (existing) {
      throw new ConflictGraphQLError(
        `Organization unit slug "${slug}" already exists`,
      );
    }

    const [organizationUnit] = await this.db
      .insert(schema.organizationUnits)
      .values({
        ...input,
        organizationId: input.organizationId,
        slug,
      })
      .returning();

    return organizationUnit;
  }

  async update(
    id: string,
    input: UpdateOrganizationUnitInput,
  ): Promise<OrganizationUnitEntity> {
    const unit = await this.findById(id);

    if (!unit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    if (input.organizationId !== unit.organizationId) {
      throw new BadRequestGraphQLError(
        'Organization unit must be in the same organization',
      );
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

    if (input.parentId) {
      const parent = await this.findParent(input.parentId);
      if (!parent) {
        throw new NotFoundGraphQLError('Parent organization unit not found');
      }
      if (parent.organizationId !== unit.organizationId) {
        throw new BadRequestGraphQLError(
          'Parent organization unit must be in the same organization',
        );
      }
    }

    if (input.typeId) {
      const type = await this.findType(input.typeId);
      if (!type) {
        throw new NotFoundGraphQLError('Organization unit type not found');
      }
    }

    let slug: string | undefined;
    if (input.name) {
      slug = slugify(input.name);
      const existing = await this.findBySlug(slug);
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
          eq(schema.organizationUnits.organizationId, input.organizationId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    return updated;
  }

  async findAllTypes(): Promise<OrganizationUnitTypeEntity[]> {
    return this.db.query.organizationUnitTypes.findMany();
  }

  async delete(id: string): Promise<OrganizationUnitEntity> {
    const unit = await this.findById(id);

    if (!unit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    if (unit.parentId === null) {
      throw new ConflictGraphQLError(
        'Root organization unit cannot be deleted',
      );
    }

    const [deleted] = await this.db
      .update(schema.organizationUnits)
      .set({ deletedAt: new Date() })
      .where(eq(schema.organizationUnits.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    return deleted;
  }
}
