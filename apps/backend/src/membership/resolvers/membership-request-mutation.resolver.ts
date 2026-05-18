import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { type AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { MembershipRequestMapper } from '../mappers/membership-request.mepper';
import { MembershipService } from '../membership.service';
import { MembershipRequest } from '../models/membership-request.model';

@Resolver(() => MembershipRequest)
export class MembershipRequestMutationResolver {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly membershipRequestMapper: MembershipRequestMapper,
  ) {}

  @Permissions(PERMISSIONS.VOLUNTEER_EDIT)
  @Mutation(() => MembershipRequest)
  async approveMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipService.approveMembershipRequest(
      id,
      context.organizationUnitId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_EDIT)
  @Mutation(() => MembershipRequest)
  async rejectMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('rejectionReason', { type: () => String }) rejectionReason: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipService.rejectMembershipRequest(
      id,
      context.organizationUnitId,
      session.user.id,
      rejectionReason,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }

  @Mutation(() => MembershipRequest)
  async cancelMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    const entity = await this.membershipService.cancelMembershipRequest(
      id,
      context.organizationUnitId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }
}
