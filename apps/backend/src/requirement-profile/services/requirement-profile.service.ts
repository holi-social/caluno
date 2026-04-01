import { Inject, Injectable } from '@nestjs/common';
import { count, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import { CreateRequirementProfileInput } from '../inputs/create-requirement-profile.input';
import { UpdateRequirementProfileInput } from '../inputs/update-requirement-profile.input';
import type { RequirementEntity } from '../schemas/requirement.schema';
import type { RequirementProfileEntity } from '../schemas/requirement-profile.schema';

@Injectable()
export class RequirementProfileService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<RequirementProfileEntity | undefined> {
    return this.db.query.requirementProfiles.findFirst({
      where: { id },
    });
  }

  async findAll(
    pagination: PaginationInput,
  ): Promise<{ items: RequirementProfileEntity[]; total: number }> {
    const items = await this.db.query.requirementProfiles.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
    const [{ total }] = await this.db.query.requirementProfiles.findMany({
      columns: {},
      extras: { total: count() },
    });
    return { items, total };
  }

  async create(
    input: CreateRequirementProfileInput,
  ): Promise<RequirementProfileEntity> {
    return this.db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(schema.requirementProfiles)
        .values({
          organizationId: input.organizationId,
          name: input.name,
          description: input.description,
        })
        .returning();

      if (input.requirementIds && input.requirementIds.length > 0) {
        await tx.insert(schema.requirementProfileRequirements).values(
          input.requirementIds.map((requirementId) => ({
            profileId: profile.id,
            requirementId,
          })),
        );
      }

      return profile;
    });
  }

  async update(
    id: string,
    input: UpdateRequirementProfileInput,
  ): Promise<RequirementProfileEntity> {
    return this.db.transaction(async (tx) => {
      const { requirementIds, ...rest } = input;
      const [profile] = await tx
        .update(schema.requirementProfiles)
        .set(rest)
        .where(eq(schema.requirementProfiles.id, id))
        .returning();

      if (!profile) {
        throw new NotFoundGraphQLError('Requirement profile not found');
      }

      if (requirementIds) {
        await tx
          .delete(schema.requirementProfileRequirements)
          .where(eq(schema.requirementProfileRequirements.profileId, id));

        if (requirementIds.length > 0) {
          await tx.insert(schema.requirementProfileRequirements).values(
            requirementIds.map((requirementId) => ({
              profileId: id,
              requirementId,
            })),
          );
        }
      }

      return profile;
    });
  }

  async delete(id: string): Promise<RequirementProfileEntity> {
    const [profile] = await this.db
      .delete(schema.requirementProfiles)
      .where(eq(schema.requirementProfiles.id, id))
      .returning();
    if (!profile) {
      throw new NotFoundGraphQLError('Requirement profile not found');
    }
    return profile;
  }

  async findRequirements(profileId: string): Promise<RequirementEntity[]> {
    const profileRequirements =
      await this.db.query.requirementProfileRequirements.findMany({
        where: { profileId },
      });
    if (profileRequirements.length === 0) {
      return [];
    }

    return this.db
      .select()
      .from(schema.requirements)
      .where(
        inArray(
          schema.requirements.id,
          profileRequirements.map((item) => item.requirementId),
        ),
      );
  }
}
