import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ForbiddenGraphQLError } from '../../graphql/errors';
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

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_APPROVE)
  @Mutation(() => MembershipRequest)
  async approveMembershipRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Session() session: UserSession,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    if (organizationUnitId !== context.organizationUnitId) {
      throw new ForbiddenGraphQLError(
        'Organization unit ID does not match the current context',
      );
    }
    const entity = await this.membershipService.approveMembershipRequest(
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
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    if (organizationUnitId !== context.organizationUnitId) {
      throw new ForbiddenGraphQLError(
        'Organization unit ID does not match the current context',
      );
    }
    const entity = await this.membershipService.rejectMembershipRequest(
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
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequest> {
    if (organizationUnitId !== context.organizationUnitId) {
      throw new ForbiddenGraphQLError(
        'Organization unit ID does not match the current context',
      );
    }
    const entity = await this.membershipService.cancelMembershipRequest(
      id,
      organizationUnitId,
      session.user.id,
    );
    return this.membershipRequestMapper.toModelOrThrow(entity);
  }
}
