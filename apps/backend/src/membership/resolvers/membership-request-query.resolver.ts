import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../auth/decorators';
import { PaginationInput } from '../../graphql/pagination.input';
import { MembershipService } from '../membership.service';
import {
  MembershipRequest,
  MembershipRequestPaginatedResponse,
} from '../models/membership-request.model';

@Resolver(() => MembershipRequest)
export class MembershipRequestQueryResolver {
  constructor(private readonly membershipRequestService: MembershipService) {}

  @Roles('STAFF')
  @Query(() => MembershipRequest)
  async membershipRequests(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args() pagination: PaginationInput,
  ): Promise<MembershipRequestPaginatedResponse> {
    return this.membershipRequestService.getMembershipRequests(
      organizationId,
      pagination,
    );
  }
}
