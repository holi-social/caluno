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

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_CREATE)
  @Mutation(() => MembershipRequest)
  async createMembershipRequest(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.createMembershipRequest(
      session.user.id,
      organizationId,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_APPROVE)
  @Mutation(() => MembershipRequest)
  async approveMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.approveMembershipRequest(
      id,
      organizationId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_REJECT)
  @Mutation(() => MembershipRequest)
  async rejectMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('rejectionReason', { type: () => String }) rejectionReason: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.rejectMembershipRequest(
      id,
      organizationId,
      session.user.id,
      rejectionReason,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_CANCEL)
  @Mutation(() => MembershipRequest)
  async cancelMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipRequestService.cancelMembershipRequest(
      id,
      organizationId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }
}
