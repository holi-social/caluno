import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { plainToInstance } from 'class-transformer';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { RequirementForm } from '../../requirement-profile/models/requirement-form.model';
import { RequirementProfile } from '../../requirement-profile/models/requirement-profile.model';
import { UserRequirementStatus } from '../../requirement-profile/models/user-requirement-status.model';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { MembershipMapper } from '../mappers/membership.mepper';
import { MembershipService } from '../membership.service';
import { JoinOrganizationResult } from '../models/join-organization-result.model';
import { Membership } from '../models/membership.model';

@Resolver(() => JoinOrganizationResult)
export class MembershipMutationResolver {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly membershipMapper: MembershipMapper,
  ) {}

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

    if (result.status === JoinStatus.JOINED) {
      return {
        status: JoinStatus.JOINED,
        membershipRequestId: null,
        requirementProfile: null,
        requirementStatuses: null,
        requiredForms: null,
      };
    }

    if (result.status === JoinStatus.PENDING) {
      return {
        status: JoinStatus.PENDING,
        membershipRequestId: result.membershipRequest.id,
        requirementProfile: null,
        requirementStatuses: null,
        requiredForms: null,
      };
    }

    if (result.status === JoinStatus.REJECTED) {
      return {
        status: JoinStatus.REJECTED,
        membershipRequestId: result.membershipRequest.id,
        requirementProfile: null,
        requirementStatuses: null,
        requiredForms: null,
      };
    }

    return {
      status: JoinStatus.REQUIREMENTS_NEEDED,
      membershipRequestId: null,
      requirementProfile: result.requirementProfile
        ? plainToInstance(RequirementProfile, result.requirementProfile)
        : null,
      requirementStatuses: result.requirementStatuses
        ? result.requirementStatuses.map((s) =>
            plainToInstance(UserRequirementStatus, s),
          )
        : null,
      requiredForms: result.requiredForms
        ? result.requiredForms.map((s) => ({
            form: plainToInstance(RequirementForm, s.form),
            order: s.order,
            submitted: s.submitted,
            submissionId: s.submissionId,
            targetType: s.targetType,
            targetId: s.targetId,
          }))
        : null,
    };
  }

  @Permissions(PERMISSIONS.VOLUNTEER_EDIT)
  @Mutation(() => Membership)
  async updateMembershipRoles(
    @Args('membershipId', { type: () => ID }) membershipId: string,
    @Args('roleIds', { type: () => [ID] }) roleIds: string[],
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Membership> {
    const entity = await this.membershipService.updateMembershipRoles(
      membershipId,
      roleIds,
      context.organizationUnitId,
    );
    return this.membershipMapper.toModelOrThrow(entity);
  }
}
