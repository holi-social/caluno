import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { MembershipMapper } from '../mappers/membership.mepper';
import { MembershipService } from '../membership.service';
import { Membership } from '../models/membership.model';

@Resolver(() => Membership)
export class MembershipQueryResolver {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly membershipMapper: MembershipMapper,
  ) {}

  @Permissions(PERMISSIONS.MEMBERSHIP_READ)
  @Query(() => Membership)
  async membership(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Session() session: UserSession,
  ): Promise<Membership | null> {
    const entity = await this.membershipService.getMembership(
      session.user.id,
      organizationId,
    );
    return this.membershipMapper.toModel(entity);
  }
}
