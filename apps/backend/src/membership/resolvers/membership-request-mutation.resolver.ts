import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Roles } from '../../auth/decorators';
import { MembershipService } from '../membership.service';
import { MembershipRequest } from '../models/membership-request.model';

@Resolver(() => MembershipRequest)
export class MembershipRequestMutationResolver {
  constructor(private readonly membershipRequestService: MembershipService) {}

  @Mutation(() => MembershipRequest)
  async createMembershipRequest(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<MembershipRequest> {
    return this.membershipRequestService.createMembershipRequest(
      session.user.id,
      organizationId,
    );
  }

  @Roles('STAFF')
  @Mutation(() => MembershipRequest)
  async approveMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<boolean> {
    return this.membershipRequestService.approveMembershipRequest(
      id,
      organizationId,
      session.user.id,
    );
  }

  @Roles('STAFF')
  @Mutation(() => MembershipRequest)
  async rejectMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('rejectionReason', { type: () => String }) rejectionReason: string,
    @Session() session: UserSession,
  ): Promise<boolean> {
    return this.membershipRequestService.rejectMembershipRequest(
      id,
      organizationId,
      session.user.id,
      rejectionReason,
    );
  }

  @Mutation(() => MembershipRequest)
  async cancelMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<boolean> {
    return this.membershipRequestService.cancelMembershipRequest(
      id,
      organizationId,
      session.user.id,
    );
  }
}
