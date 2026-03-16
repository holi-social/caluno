import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { MembershipService } from '../membership.service';

@Resolver()
export class MembershipMutationResolver {
  constructor(private readonly membershipService: MembershipService) {}

  @Permissions(PERMISSIONS.MEMBERSHIP_UPDATE)
  @Mutation(() => Boolean)
  async assignRoleToMembership(
    @Args('membershipId', { type: () => ID }) membershipId: string,
    @Args('roleId', { type: () => ID }) roleId: string,
  ): Promise<boolean> {
    return this.membershipService.assignRoleToMembership(membershipId, roleId);
  }
}
