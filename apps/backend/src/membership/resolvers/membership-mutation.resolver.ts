import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { JoinOrganizationStatus } from '../enums';
import { MembershipService } from '../membership.service';
import { JoinOrganizationResult } from '../models/join-organization-result.model';

@Resolver(() => JoinOrganizationResult)
export class MembershipMutationResolver {
  constructor(private readonly membershipService: MembershipService) {}

  @Mutation(() => JoinOrganizationResult)
  async joinOrganization(
    @Args('organizationUnitId', { type: () => ID })
    organizationUnitId: string,
    @Session() session: UserSession,
  ): Promise<JoinOrganizationResult> {
    const result = await this.membershipService.requestOrgJoin(
      session.user.id,
      organizationUnitId,
    );

    if (result.status === 'JOINED') {
      return {
        status: JoinOrganizationStatus.JOINED,
        membershipRequestId: null,
        requirementProfile: null,
        requirementStatuses: null,
      };
    }

    if (result.status === 'MEMBERSHIP_REQUESTED') {
      return {
        status: JoinOrganizationStatus.MEMBERSHIP_REQUESTED,
        membershipRequestId: result.membershipRequest.id,
        requirementProfile: null,
        requirementStatuses: null,
      };
    }

    return {
      status: JoinOrganizationStatus.REQUIREMENTS_NEEDED,
      membershipRequestId: null,
      requirementProfile: result.requirementProfile
        ? plainToInstance(RequirementProfile, result.requirementProfile)
        : null,
      requirementStatuses: result.requirementStatuses.map((s) =>
        plainToInstance(UserRequirementStatus, s),
      ),
    };
  }
}
