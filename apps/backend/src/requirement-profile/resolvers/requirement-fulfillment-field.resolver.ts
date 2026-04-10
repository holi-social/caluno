import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { RequirementMapper } from '../mappers/requirement.mapper';
import { RequirementProfileSubmissionMapper } from '../mappers/requirement-profile-submission.mapper';
import { Document } from '../models/document.model';
import { OrganizationUserProfile } from '../models/organization-user-profile.model';
import { Requirement } from '../models/requirement.model';
import { RequirementFulfillment } from '../models/requirement-fulfillment.model';
import { RequirementProfileSubmission } from '../models/requirement-profile-submission.model';
import type { RequirementFulfillmentEntity } from '../schemas/requirement-fulfillment.schema';
import {
  RequirementFulfillmentService,
  RequirementProfileSubmissionService,
} from '../services';
import { OrganizationUserProfileMapper } from '../mappers/organization-user-profile.mapper';
import { DocumentMapper } from '../mappers/document.mapper';

@Resolver(() => RequirementFulfillment)
export class RequirementFulfillmentFieldResolver {
  constructor(
    private readonly requirementFulfillmentService: RequirementFulfillmentService,
    private readonly requirementProfileSubmissionService: RequirementProfileSubmissionService,
    private readonly requirementProfileSubmissionMapper: RequirementProfileSubmissionMapper,
    private readonly requirementMapper: RequirementMapper,
    private readonly documentMapper: DocumentMapper,
    private readonly organizationUserProfileMapper: OrganizationUserProfileMapper,
    private readonly userMapper: UserMapper,
    private readonly userService: UserService,
  ) {}

  @ResolveField(() => RequirementProfileSubmission)
  async submission(
    @Parent() fulfillment: RequirementFulfillmentEntity,
  ): Promise<RequirementProfileSubmission> {
    const submission = await this.requirementProfileSubmissionService.findById(
      fulfillment.submissionId,
    );
    return this.requirementProfileSubmissionMapper.toModelOrThrow(submission);
  }

  @ResolveField(() => Requirement)
  async requirement(
    @Parent() fulfillment: RequirementFulfillmentEntity,
  ): Promise<Requirement> {
    const entity = await this.requirementFulfillmentService.findRequirement(
      fulfillment.requirementId,
    );
    return this.requirementMapper.toModelOrThrow(entity);
  }

  @ResolveField(() => User, { nullable: true })
  async reviewer(
    @Parent() fulfillment: RequirementFulfillmentEntity,
  ): Promise<User | null> {
    if (!fulfillment.reviewedById) {
      return null;
    }
    const reviewer = await this.userService.findById(fulfillment.reviewedById);
    if (!reviewer) {
      return null;
    }
    return this.userMapper.toModelOrThrow(reviewer);
  }

  @ResolveField(() => OrganizationUserProfile, { nullable: true })
  async profile(
    @Parent() fulfillment: RequirementFulfillmentEntity,
  ): Promise<OrganizationUserProfile | null> {
    if (!fulfillment.profileId) {
      return null;
    }
    const profile = await this.requirementFulfillmentService.findProfileById(
      fulfillment.profileId,
    );
    return this.organizationUserProfileMapper.toModelOrThrow(profile);
  }

  @ResolveField(() => Document, { nullable: true })
  async document(
    @Parent() fulfillment: RequirementFulfillmentEntity,
  ): Promise<Document | null> {
    if (!fulfillment.documentId) {
      return null;
    }
    const document = await this.requirementFulfillmentService.findDocumentById(
      fulfillment.documentId,
    );
    return this.documentMapper.toModelOrThrow(document);
  }
}
