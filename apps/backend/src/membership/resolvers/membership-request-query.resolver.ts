import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
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

  @Permissions(PERMISSIONS.MEMBERSHIP_REQUEST_READ)
  @Query(() => MembershipRequestPaginatedResponse)
  async membershipRequests(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args('status', { type: () => MembershipRequestStatus, nullable: true })
    status: MembershipRequestStatus | null,
    @Args() pagination: PaginationInput,
  ): Promise<MembershipRequestPaginatedResponse> {
    const items = await this.membershipRequestService.getMembershipRequests(
      organizationId,
      status ?? MembershipRequestStatus.PENDING,
    );
    return new MembershipRequestPaginatedResponse({
      items: this.membershipRequestMapper.toArray(items),
      total: items.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
