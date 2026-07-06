import { Args, Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftInviteStatus } from '../enums';
import { ShiftInstance } from '../models/shift-instance.model';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import { ShiftService } from '../shift.service';

@Resolver(() => ShiftInstance)
export class ShiftInstanceFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
  ) {}

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @ResolveField(() => [User])
  async volunteers(
    @Parent() instance: ShiftInstanceEntity,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(
      instance.id,
      context.organizationUnitId,
    );
    return this.userMapper.toArray(volunteers);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @ResolveField(() => ShiftInviteStatus, { nullable: true })
  async inviteStatus(
    @Parent() instance: ShiftInstanceEntity,
    @Context() context: AuthenticatedGraphQLContext,
    @Args('userId') userId: string,
  ): Promise<ShiftInviteStatus | null> {
    const invite = await this.shiftService.findInvite(
      context.organizationUnitId,
      instance.id,
      userId,
    );

    if (invite) {
      return invite.status as ShiftInviteStatus;
    } else {
      return null;
    }
  }

  @ResolveField(() => Boolean)
  async isCheckedIn(
    @Parent() instance: ShiftInstanceEntity,
    @Session() session: UserSession,
  ): Promise<boolean> {
    if (!session?.user) {
      return false;
    }

    return this.shiftService.hasOpenTimeEntry(instance.id, session.user.id);
  }

  @ResolveField(() => Number)
  async filledCount(@Parent() instance: ShiftInstanceEntity): Promise<number> {
    return this.shiftService.getFilledCount(instance.id);
  }
}
