import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { MembershipMapper } from '../mappers/membership.mepper';
import { MembershipService } from '../membership.service';
import { Membership } from '../models/membership.model';

@Resolver(() => Membership)
export class MembershipQueryResolver {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly membershipMapper: MembershipMapper,
    private readonly userMapper: UserMapper,
  ) {}

  @Permissions(PERMISSIONS.MEMBERSHIP_READ)
  @Query(() => Membership)
  async membership(
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
    @Session() session: UserSession,
  ): Promise<Membership | null> {
    const entity = await this.membershipService.getMembership(
      session.user.id,
      organizationUnitId,
    );
    return this.membershipMapper.toModel(entity);
  }

  @Permissions(PERMISSIONS.MEMBERSHIP_READ)
  @Query(() => [User])
  async members(
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
  ): Promise<User[]> {
    const users = await this.membershipService.getMembers(organizationUnitId);
    return this.userMapper.toArray(users);
  }
}
