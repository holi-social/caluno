import { Inject, Injectable } from '@nestjs/common';
import { count, eq, inArray } from 'drizzle-orm';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { NotFoundGraphQLError } from '../../graphql/errors';
import { BadRequestGraphQLError } from '../../graphql/errors/bad-request.error';
import type { PaginationInput } from '../../graphql/pagination.input';
import type { MembershipEntity } from '../../membership/schemas/membership.schema';
import type { MembershipRequestEntity } from '../../membership/schemas/membership-request.schema';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import { FilePurpose } from '../../storage/enums';
import { FileService } from '../../storage/services/file.service';
import { UserService } from '../../user/user.service';
import { RequirementType } from '../enums';
import {
  CreateRequirementProfileSubmissionInput,
  type CreateRequirementSubmissionFulfillmentInput,
} from '../inputs/create-requirement-profile-submission.input';
import { UpdateRequirementFulfillmentInput } from '../inputs/update-requirement-fulfillment.input';
import { UpdateRequirementProfileSubmissionInput } from '../inputs/update-requirement-profile-submission.input';
import type { OrganizationUserProfileEntity } from '../schemas/organization-user-profile.schema';
import type { RequirementEntity } from '../schemas/requirement.schema';
import type { RequirementFulfillmentEntity } from '../schemas/requirement-fulfillment.schema';
import type { RequirementProfileEntity } from '../schemas/requirement-profile.schema';
import type { RequirementProfileSubmissionEntity } from '../schemas/requirement-profile-submission.schema';
import { RequirementService } from './requirement.service';
import { RequirementProfileService } from './requirement-profile.service';

@Injectable()
export class RequirementProfileSubmissionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userService: UserService,
    private readonly requirementProfileService: RequirementProfileService,
    private readonly requirementService: RequirementService,
    private readonly fileService: FileService,
    private readonly postHogService: PostHogService,
  ) {}

  async findById(
    id: string,
  ): Promise<RequirementProfileSubmissionEntity | undefined> {
    return this.db.query.requirementProfileSubmissions.findFirst({
      where: { id },
    });
  }

  async findAll(
    pagination: PaginationInput,
  ): Promise<{ items: RequirementProfileSubmissionEntity[]; total: number }> {
    const items = await this.db.query.requirementProfileSubmissions.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
    const [{ total }] =
      await this.db.query.requirementProfileSubmissions.findMany({
        columns: {},
        extras: { total: count() },
      });
    return { items, total };
  }

  async create(
    input: CreateRequirementProfileSubmissionInput,
    userId: string,
  ): Promise<RequirementProfileSubmissionEntity> {
    if (input.fulfillments?.length) {
      const requirementToTypeMap = await this.createRequirementToTypeMap(
        input.fulfillments.map((fulfillment) => fulfillment.requirementId),
      );
      await this.validateDocumentFulfillments(
        input.fulfillments,
        requirementToTypeMap,
        userId,
        true,
      );
    }

    const submission = await this.db.transaction(async (tx) => {
      const { fulfillments, ...submissionInput } = input;
      const requirementProfile = await this.findProfile(
        submissionInput.profileId,
      );
      const organizationUserProfile =
        await this.userService.findOrganizationUserProfile(
          userId,
          requirementProfile.organizationId,
        );
      const [created] = await tx
        .insert(schema.requirementProfileSubmissions)
        .values(submissionInput)
        .returning();

      if (fulfillments && fulfillments.length > 0) {
        const requirementToTypeMap = await this.createRequirementToTypeMap(
          fulfillments.map((fulfillment) => fulfillment.requirementId),
        );
        await tx.insert(schema.requirementFulfillments).values(
          fulfillments.map((fulfillment) => {
            const requirementType =
              requirementToTypeMap[fulfillment.requirementId];
            if (!requirementType) {
              throw new NotFoundGraphQLError('Requirement not found');
            }
            const value = this.getFulfillmentValue(
              fulfillment,
              requirementType,
              true,
            );

            return {
              requirementId: fulfillment.requirementId,
              profileId: organizationUserProfile.id,
              submissionId: created.id,
              type: requirementType,
              value,
            };
          }),
        );
      }

      return { created, organizationId: requirementProfile.organizationId };
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_PROFILE_SUBMISSION_CREATE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: submission.organizationId,
      },
    });

    return submission.created;
  }

  private getFulfillmentValue(
    input:
      | CreateRequirementSubmissionFulfillmentInput
      | UpdateRequirementFulfillmentInput,
    requirementType: string,
    valueRequired: boolean,
  ) {
    switch (requirementType) {
      case RequirementType.DOCUMENT: {
        const fileId = input.fileId;
        if (fileId === undefined && valueRequired) {
          throw new BadRequestGraphQLError(
            'File ID is required for document fulfillment',
          );
        }
        return fileId ? { fileId } : null;
      }
      case RequirementType.CHECK:
        if (input.checked === undefined && valueRequired) {
          throw new BadRequestGraphQLError(
            'Checked is required for check fulfillment',
          );
        }
        return input.checked ? { checked: input.checked } : null;
      case RequirementType.DATE:
        if (input.date === undefined && valueRequired) {
          throw new BadRequestGraphQLError(
            'Date is required for date fulfillment',
          );
        }
        return input.date ? { date: input.date } : null;
      case RequirementType.TEXT:
        if (input.text === undefined && valueRequired) {
          throw new BadRequestGraphQLError(
            'Text is required for text fulfillment',
          );
        }
        return input.text ? { text: input.text } : null;
      default:
        throw new Error(`Unknown requirement type: ${requirementType}`);
    }
  }

  async update(
    id: string,
    input: UpdateRequirementProfileSubmissionInput,
    reviewedById?: string,
  ): Promise<RequirementProfileSubmissionEntity> {
    const [submission] = await this.db
      .update(schema.requirementProfileSubmissions)
      .set({
        ...input,
        ...(reviewedById ? { reviewedById, reviewedAt: new Date() } : {}),
      })
      .where(eq(schema.requirementProfileSubmissions.id, id))
      .returning();
    if (!submission) {
      throw new NotFoundGraphQLError(
        'Requirement profile submission not found',
      );
    }

    if (reviewedById) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.REQUIREMENT_PROFILE_SUBMISSION_UPDATE,
        userId: reviewedById,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
        },
      });
    }

    return submission;
  }

  async delete(
    id: string,
    userId: string,
  ): Promise<RequirementProfileSubmissionEntity> {
    const [submission] = await this.db
      .delete(schema.requirementProfileSubmissions)
      .where(eq(schema.requirementProfileSubmissions.id, id))
      .returning();
    if (!submission) {
      throw new NotFoundGraphQLError(
        'Requirement profile submission not found',
      );
    }

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_PROFILE_SUBMISSION_DELETE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
      },
    });

    return submission;
  }

  async findProfile(profileId: string): Promise<RequirementProfileEntity> {
    const profile = await this.requirementProfileService.findById(profileId);
    if (!profile) {
      throw new NotFoundGraphQLError('Requirement profile not found');
    }
    return profile;
  }

  async findFulfillments(
    submissionId: string,
  ): Promise<RequirementFulfillmentEntity[]> {
    return this.db.query.requirementFulfillments.findMany({
      where: { submissionId },
    });
  }

  async findFulfillmentById(
    id: string,
  ): Promise<RequirementFulfillmentEntity | undefined> {
    return this.db.query.requirementFulfillments.findFirst({
      where: { id },
    });
  }

  async findAllFulfillments(
    pagination: PaginationInput,
  ): Promise<{ items: RequirementFulfillmentEntity[]; total: number }> {
    const items = await this.db.query.requirementFulfillments.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy: { createdAt: 'desc' },
    });
    const [{ total }] = await this.db.query.requirementFulfillments.findMany({
      columns: {},
      extras: { total: count() },
    });
    return { items, total };
  }

  async updateFulfillment(
    id: string,
    input: UpdateRequirementFulfillmentInput,
    reviewerId?: string,
  ): Promise<RequirementFulfillmentEntity> {
    const existingFulfillment = await this.findFulfillmentById(id);
    if (!existingFulfillment) {
      throw new NotFoundGraphQLError('Requirement fulfillment not found');
    }

    if (existingFulfillment.type === RequirementType.DOCUMENT && input.fileId) {
      await this.fileService.assertUploadedFileForPurpose(
        input.fileId,
        FilePurpose.REQUIREMENT_DOCUMENT,
      );
    }

    const updatePayload = this.buildFulfillmentUpdatePayload(
      existingFulfillment,
      input,
    );

    const [fulfillment] = await this.db
      .update(schema.requirementFulfillments)
      .set({
        ...updatePayload,
        ...(reviewerId
          ? { reviewedById: reviewerId, reviewedAt: new Date() }
          : {}),
      })
      .where(eq(schema.requirementFulfillments.id, id))
      .returning();

    if (!fulfillment) {
      throw new NotFoundGraphQLError('Requirement fulfillment not found');
    }

    if (reviewerId) {
      this.postHogService.capture({
        event: POSTHOG_EVENT.REQUIREMENT_FULFILLMENT_UPDATE,
        userId: reviewerId,
        properties: {
          surface: POSTHOG_SURFACE.BACKOFFICE,
        },
      });
    }

    return fulfillment;
  }

  async deleteFulfillment(
    id: string,
    userId: string,
  ): Promise<RequirementFulfillmentEntity> {
    const [fulfillment] = await this.db
      .delete(schema.requirementFulfillments)
      .where(eq(schema.requirementFulfillments.id, id))
      .returning();
    if (!fulfillment) {
      throw new NotFoundGraphQLError('Requirement fulfillment not found');
    }

    this.postHogService.capture({
      event: POSTHOG_EVENT.REQUIREMENT_FULFILLMENT_DELETE,
      userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
      },
    });

    return fulfillment;
  }

  async findRequirement(requirementId: string): Promise<RequirementEntity> {
    const requirement = await this.requirementService.findById(requirementId);
    if (!requirement) {
      throw new NotFoundGraphQLError('Requirement not found');
    }
    return requirement;
  }

  async findProfileById(
    id: string,
  ): Promise<OrganizationUserProfileEntity | null> {
    const profile = await this.db.query.organizationUserProfiles.findFirst({
      where: { id },
    });
    return profile ?? null;
  }

  async findReviewerById(id: string | null): Promise<UserEntity | null> {
    if (!id) {
      return null;
    }
    const reviewer = await this.userService.findById(id);
    return reviewer ?? null;
  }

  async findMembershipById(id: string): Promise<MembershipEntity | undefined> {
    return this.db.query.memberships.findFirst({
      where: { id },
    });
  }

  async findRequestById(
    id: string,
  ): Promise<MembershipRequestEntity | undefined> {
    return this.db.query.membershipRequests.findFirst({
      where: { id },
    });
  }

  private async createRequirementToTypeMap(
    requirementIds: string[],
  ): Promise<Record<string, RequirementEntity['type']>> {
    const uniqueRequirementIds = [...new Set(requirementIds)];
    if (uniqueRequirementIds.length === 0) {
      return {};
    }

    const requirements = await this.db
      .select({
        id: schema.requirements.id,
        type: schema.requirements.type,
      })
      .from(schema.requirements)
      .where(inArray(schema.requirements.id, uniqueRequirementIds));

    const requirementTypes = requirements.reduce<
      Record<string, RequirementEntity['type']>
    >((acc, requirement) => {
      acc[requirement.id] = requirement.type;
      return acc;
    }, {});

    for (const requirementId of uniqueRequirementIds) {
      if (!requirementTypes[requirementId]) {
        throw new NotFoundGraphQLError('Requirement not found');
      }
    }

    return requirementTypes;
  }

  private async validateDocumentFulfillments(
    fulfillments: CreateRequirementSubmissionFulfillmentInput[],
    requirementToTypeMap: Record<string, RequirementEntity['type']>,
    userId: string,
    valueRequired: boolean,
  ): Promise<void> {
    for (const fulfillment of fulfillments) {
      if (
        requirementToTypeMap[fulfillment.requirementId] !==
        RequirementType.DOCUMENT
      ) {
        continue;
      }

      const fileId = fulfillment.fileId;
      if (!fileId) {
        if (valueRequired) {
          throw new BadRequestGraphQLError(
            'File ID is required for document fulfillment',
          );
        }
        continue;
      }

      await this.fileService.assertUploadedFileOwnedByUser(
        fileId,
        userId,
        FilePurpose.REQUIREMENT_DOCUMENT,
      );
    }
  }

  private buildFulfillmentUpdatePayload(
    existingFulfillment: RequirementFulfillmentEntity,
    input: UpdateRequirementFulfillmentInput,
  ) {
    const value = this.getFulfillmentValue(
      input,
      existingFulfillment.type,
      false,
    );
    return {
      ...(value != null && { value }),
    };
  }
}
