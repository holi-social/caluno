import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../../auth/decorators';
import { PaginationInput } from '../../graphql/pagination.input';
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

  @Roles('STAFF')
  @Query(() => MembershipRequestPaginatedResponse)
  async membershipRequests(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args() pagination: PaginationInput,
  ): Promise<MembershipRequestPaginatedResponse> {
    const items =
      await this.membershipRequestService.getMembershipRequests(organizationId);
    return new MembershipRequestPaginatedResponse({
      items: this.membershipRequestMapper.toArray(items),
      total: items.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
