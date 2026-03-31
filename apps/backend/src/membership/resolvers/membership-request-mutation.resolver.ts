import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { MembershipRequestMapper } from '../mappers/membership-request.mepper';
import { MembershipService } from '../membership.service';
import { MembershipRequest } from '../models/membership-request.model';

@Resolver(() => MembershipRequest)
export class MembershipRequestMutationResolver {
  constructor(
    private readonly membershipRequestService: MembershipService,
    private readonly membershipRequestMapper: MembershipRequestMapper,
  ) {}

  @Mutation(() => MembershipRequest)
  async createMembershipRequest(
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.createMembershipRequest(
      session.user.id,
      organizationUnitId,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_APPROVE)
  @Mutation(() => MembershipRequest)
  async approveMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.approveMembershipRequest(
      id,
      organizationUnitId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_REJECT)
  @Mutation(() => MembershipRequest)
  async rejectMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Args('rejectionReason', { type: () => String }) rejectionReason: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.rejectMembershipRequest(
      id,
      organizationUnitId,
      session.user.id,
      rejectionReason,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_CANCEL)
  @Mutation(() => MembershipRequest)
  async cancelMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.cancelMembershipRequest(
      id,
      organizationUnitId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }
}
