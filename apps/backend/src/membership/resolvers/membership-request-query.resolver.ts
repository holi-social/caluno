import { Args, Context, Int, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { MembershipRequestStatus } from '../enums';
import { MembershipRequestMapper } from '../mappers/membership-request.mepper';
import { MembershipService } from '../membership.service';
import {
  MembershipRequest,
  MembershipRequestPaginatedResponse,
} from '../models/membership-request.model';

@Resolver(() => MembershipRequest)
export class MembershipRequestQueryResolver {
  constructor(
    private readonly membershipRequestService: MembershipService,
    private readonly membershipRequestMapper: MembershipRequestMapper,
  ) {}

  @Permissions(PERMISSIONS.VOLUNTEER_VIEW)
  @Query(() => MembershipRequestPaginatedResponse)
  async membershipRequests(
    @Args('status', { type: () => MembershipRequestStatus, nullable: true })
    status: MembershipRequestStatus | null | undefined,
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<MembershipRequestPaginatedResponse> {
    const items = await this.membershipRequestService.getMembershipRequests(
      context.organizationUnitId,
      status ?? undefined,
    );
    return new MembershipRequestPaginatedResponse({
      items: this.membershipRequestMapper.toArray(items),
      total: items.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Permissions(PERMISSIONS.VOLUNTEER_VIEW)
  @Query(() => Int)
  async membershipRequestCount(
    @Args('status', { type: () => MembershipRequestStatus, nullable: true })
    status: MembershipRequestStatus | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<number> {
    return this.membershipRequestService.getMembershipRequestCount(
      context.organizationUnitId,
      status ?? undefined,
    );
  }

  @Query(() => MembershipRequestPaginatedResponse)
  async myMembershipRequests(
    @Session() session: UserSession,
    @Args('status', { type: () => MembershipRequestStatus, nullable: true })
    status: MembershipRequestStatus | null | undefined,
    @Args() pagination: PaginationInput,
  ): Promise<MembershipRequestPaginatedResponse> {
    const items = await this.membershipRequestService.getMyMembershipRequests(
      session.user.id,
      status ?? undefined,
    );
    return new MembershipRequestPaginatedResponse({
      items: this.membershipRequestMapper.toArray(items),
      total: items.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
