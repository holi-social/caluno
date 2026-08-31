import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import {
  RequirementFulfillmentStatus,
  RequirementProfileSubmissionStatus,
} from '../enums';
import { CreateRequirementProfileInput } from '../inputs/create-requirement-profile.input';
import { UpdateRequirementProfileInput } from '../inputs/update-requirement-profile.input';
export interface UserRequirementStatusDto {
  requirementId: string;
  name: string;
  status: RequirementFulfillmentStatus;
}

import type { RequirementEntity } from '../schemas/requirement.schema';
import type { RequirementProfileEntity } from '../schemas/requirement-profile.schema';
import { isUnitInOrg } from './is-unit-in-org';

@Injectable()
export class RequirementProfileService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly postHogService: PostHogService,
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
    organizationUnitId: string,
    userId: string,
  ): Promise<RequirementProfileEntity> {
    await isUnitInOrg(this.db, organizationUnitId, input.organizationId);

    const profile = await this.db.transaction(async (tx) => {
      const [created] = await tx
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
            profileId: created.id,
            requirementId,
          })),
        );
      }

      return created;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_PROFILE_CREATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: profile.organizationId,
        organization_unit_id: organizationUnitId,
      },
    });

    return profile;
  }

  async update(
    id: string,
    organizationUnitId: string,
    input: UpdateRequirementProfileInput,
    userId: string,
  ): Promise<RequirementProfileEntity> {
    const existingProfile = await this.findById(id);
    if (!existingProfile) {
      throw new NotFoundGraphQLError('Requirement profile not found');
    }

    await isUnitInOrg(
      this.db,
      organizationUnitId,
      existingProfile.organizationId,
    );

    const profile = await this.db.transaction(async (tx) => {
      const { requirementIds, ...rest } = input;
      const [updated] = await tx
        .update(schema.requirementProfiles)
        .set(rest)
        .where(eq(schema.requirementProfiles.id, id))
        .returning();

      if (!updated) {
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

      return updated;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_PROFILE_UPDATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: profile.organizationId,
        organization_unit_id: organizationUnitId,
      },
    });

    return profile;
  }

  async delete(
    id: string,
    organizationUnitId: string,
    userId: string,
  ): Promise<RequirementProfileEntity> {
    const existingProfile = await this.findById(id);
    if (!existingProfile) {
      throw new NotFoundGraphQLError('Requirement profile not found');
    }

    await isUnitInOrg(
      this.db,
      organizationUnitId,
      existingProfile.organizationId,
    );

    const [profile] = await this.db
      .delete(schema.requirementProfiles)
      .where(eq(schema.requirementProfiles.id, id))
      .returning();
    if (!profile) {
      throw new NotFoundGraphQLError('Requirement profile not found');
    }

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_PROFILE_DELETE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: profile.organizationId,
        organization_unit_id: organizationUnitId,
      },
    });

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

  async hasApprovedSubmission(
    userId: string,
    profileId: string,
  ): Promise<boolean> {
    const result = await this.db
      .select({ id: schema.requirementProfileSubmissions.id })
      .from(schema.requirementProfileSubmissions)
      .innerJoin(
        schema.requirementFulfillments,
        eq(
          schema.requirementProfileSubmissions.id,
          schema.requirementFulfillments.submissionId,
        ),
      )
      .innerJoin(
        schema.organizationUserProfiles,
        eq(
          schema.requirementFulfillments.organizationUserProfileId,
          schema.organizationUserProfiles.id,
        ),
      )
      .where(
        and(
          eq(schema.requirementProfileSubmissions.profileId, profileId),
          eq(
            schema.requirementProfileSubmissions.status,
            RequirementProfileSubmissionStatus.APPROVED,
          ),
          eq(schema.organizationUserProfiles.userId, userId),
        ),
      )
      .limit(1);

    return result.length > 0;
  }

  async getUserRequirementStatus(
    userId: string,
    profileId: string,
  ): Promise<UserRequirementStatusDto[]> {
    const requirements = await this.findRequirements(profileId);

    if (requirements.length === 0) {
      return [];
    }

    const profile = await this.findById(profileId);
    if (!profile) {
      throw new NotFoundGraphQLError('Requirement profile not found');
    }

    const userProfile = await this.db.query.organizationUserProfiles.findFirst({
      where: { userId, organizationId: profile.organizationId },
    });

    if (!userProfile) {
      return requirements.map((req) => ({
        requirementId: req.id,
        name: req.name,
        status: RequirementFulfillmentStatus.DRAFT,
      }));
    }

    const submissions =
      await this.db.query.requirementProfileSubmissions.findMany({
        where: {
          profileId,
        },
        with: {
          fulfillments: true,
        },
      });

    const userSubmissions = submissions.filter((sub) =>
      sub.fulfillments.some(
        (f) => f.organizationUserProfileId === userProfile.id,
      ),
    );

    const requirementStatusMap = new Map<
      string,
      RequirementFulfillmentStatus
    >();

    for (const submission of userSubmissions) {
      for (const fulfillment of submission.fulfillments) {
        const currentStatus = requirementStatusMap.get(
          fulfillment.requirementId,
        );
        const newStatus = fulfillment.status as RequirementFulfillmentStatus;

        if (!currentStatus) {
          requirementStatusMap.set(fulfillment.requirementId, newStatus);
          continue;
        }

        const priority = {
          [RequirementFulfillmentStatus.APPROVED]: 4,
          [RequirementFulfillmentStatus.REJECTED]: 3,
          [RequirementFulfillmentStatus.SUBMITTED]: 2,
          [RequirementFulfillmentStatus.DRAFT]: 1,
        };

        if (priority[newStatus] > priority[currentStatus]) {
          requirementStatusMap.set(fulfillment.requirementId, newStatus);
        }
      }
    }

    return requirements.map((req) => ({
      requirementId: req.id,
      name: req.name,
      status:
        requirementStatusMap.get(req.id) ?? RequirementFulfillmentStatus.DRAFT,
    }));
  }
}
