import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import { NotFoundGraphQLError } from '../../graphql/errors';
import type { PaginationInput } from '../../graphql/pagination.input';
import type { MembershipEntity } from '../../membership/schemas/membership.schema';
import type { MembershipRequestEntity } from '../../membership/schemas/membership-request.schema';
import { UserService } from '../../user/user.service';
import { CreateRequirementProfileSubmissionInput } from '../inputs/create-requirement-profile-submission.input';
import { UpdateRequirementFulfillmentInput } from '../inputs/update-requirement-fulfillment.input';
import { UpdateRequirementProfileSubmissionInput } from '../inputs/update-requirement-profile-submission.input';
import type { DocumentEntity } from '../schemas/document.schema';
import type { OrganizationUserProfileEntity } from '../schemas/organization-user-profile.schema';
import type { RequirementEntity } from '../schemas/requirement.schema';
import type { RequirementFulfillmentEntity } from '../schemas/requirement-fulfillment.schema';
import type { RequirementProfileEntity } from '../schemas/requirement-profile.schema';
import type { RequirementProfileSubmissionEntity } from '../schemas/requirement-profile-submission.schema';
import { RequirementProfileService } from './requirement-profile.service';
import { RequirementService } from './requirement.service';

@Injectable()
export class RequirementProfileSubmissionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly userService: UserService,
    private readonly requirementProfileService: RequirementProfileService,
    private readonly requirementService: RequirementService,
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
  ): Promise<RequirementProfileSubmissionEntity> {
    return this.db.transaction(async (tx) => {
      const { fulfillments, ...submissionInput } = input;
      const [submission] = await tx
        .insert(schema.requirementProfileSubmissions)
        .values(submissionInput)
        .returning();

      if (fulfillments && fulfillments.length > 0) {
        await tx.insert(schema.requirementFulfillments).values(
          fulfillments.map((fulfillment) => ({
            ...fulfillment,
            submissionId: submission.id,
          })),
        );
      }

      return submission;
    });
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
    return submission;
  }

  async delete(id: string): Promise<RequirementProfileSubmissionEntity> {
    const [submission] = await this.db
      .delete(schema.requirementProfileSubmissions)
      .where(eq(schema.requirementProfileSubmissions.id, id))
      .returning();
    if (!submission) {
      throw new NotFoundGraphQLError(
        'Requirement profile submission not found',
      );
    }
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
    const [fulfillment] = await this.db
      .update(schema.requirementFulfillments)
      .set({
        ...input,
        ...(reviewerId ? { reviewerId, reviewedAt: new Date() } : {}),
      })
      .where(eq(schema.requirementFulfillments.id, id))
      .returning();

    if (!fulfillment) {
      throw new NotFoundGraphQLError('Requirement fulfillment not found');
    }

    return fulfillment;
  }

  async deleteFulfillment(id: string): Promise<RequirementFulfillmentEntity> {
    const [fulfillment] = await this.db
      .delete(schema.requirementFulfillments)
      .where(eq(schema.requirementFulfillments.id, id))
      .returning();
    if (!fulfillment) {
      throw new NotFoundGraphQLError('Requirement fulfillment not found');
    }
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

  async findDocumentById(id: string): Promise<DocumentEntity | null> {
    const document = await this.db.query.documents.findFirst({
      where: { id },
    });
    return document ?? null;
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
}
