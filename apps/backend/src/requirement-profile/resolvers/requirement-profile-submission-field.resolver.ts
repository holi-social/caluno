import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { MembershipMapper } from '../../membership/mappers/membership.mepper';
import { MembershipRequestMapper } from '../../membership/mappers/membership-request.mepper';
import { Membership } from '../../membership/models/membership.model';
import { MembershipRequest } from '../../membership/models/membership-request.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { RequirementFulfillmentMapper } from '../mappers/requirement-fulfillment.mapper';
import { RequirementProfileMapper } from '../mappers/requirement-profile.mapper';
import { RequirementFulfillment } from '../models/requirement-fulfillment.model';
import { RequirementProfile } from '../models/requirement-profile.model';
import { RequirementProfileSubmission } from '../models/requirement-profile-submission.model';
import type { RequirementProfileSubmissionEntity } from '../schemas/requirement-profile-submission.schema';
import { RequirementProfileSubmissionService } from '../services';

@Resolver(() => RequirementProfileSubmission)
export class RequirementProfileSubmissionFieldResolver {
  constructor(
    private readonly requirementProfileSubmissionService: RequirementProfileSubmissionService,
    private readonly requirementProfileMapper: RequirementProfileMapper,
    private readonly requirementFulfillmentMapper: RequirementFulfillmentMapper,
    private readonly userMapper: UserMapper,
    private readonly membershipMapper: MembershipMapper,
    private readonly membershipRequestMapper: MembershipRequestMapper,
  ) {}

  @ResolveField(() => RequirementProfile)
  async requirementProfile(
    @Parent() submission: RequirementProfileSubmissionEntity,
  ): Promise<RequirementProfile> {
    const entity = await this.requirementProfileSubmissionService.findProfile(
      submission.profileId,
    );
    return this.requirementProfileMapper.toModelOrThrow(entity);
  }

  @ResolveField(() => [RequirementFulfillment], { nullable: true })
  async fulfillments(
    @Parent() submission: RequirementProfileSubmissionEntity,
  ): Promise<RequirementFulfillment[]> {
    const entities =
      await this.requirementProfileSubmissionService.findFulfillments(
        submission.id,
      );
    return this.requirementFulfillmentMapper.toArray(entities);
  }

  @ResolveField(() => User, { nullable: true })
  async reviewer(
    @Parent() submission: RequirementProfileSubmissionEntity,
  ): Promise<User | null> {
    const reviewer =
      await this.requirementProfileSubmissionService.findReviewerById(
        submission.reviewedById,
      );
    if (!reviewer) {
      return null;
    }
    return this.userMapper.toModelOrThrow(reviewer);
  }

  @ResolveField(() => Membership, { nullable: true })
  async membership(
    @Parent() submission: RequirementProfileSubmissionEntity,
  ): Promise<Membership | null> {
    if (!submission.membershipId) {
      return null;
    }
    const membership =
      await this.requirementProfileSubmissionService.findMembershipById(
        submission.membershipId,
      );
    return this.membershipMapper.toModel(membership);
  }

  @ResolveField(() => MembershipRequest, { nullable: true })
  async membershipRequest(
    @Parent() submission: RequirementProfileSubmissionEntity,
  ): Promise<MembershipRequest | null> {
    if (!submission.membershipRequestId) {
      return null;
    }
    const request =
      await this.requirementProfileSubmissionService.findRequestById(
        submission.membershipRequestId,
      );
    return this.membershipRequestMapper.toModel(request);
  }
}
