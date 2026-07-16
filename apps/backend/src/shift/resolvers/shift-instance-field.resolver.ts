import { Args, Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Loader } from '../../graphql/decorators';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftInstanceInviteMapper } from '../mappers/shift-instance-invite.mapper';
import { ShiftInstance } from '../models/shift-instance.model';
import { ShiftInstanceInvite } from '../models/shift-instance-invite.model';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import { ShiftService } from '../shift.service';
import { ShiftInstanceInvitesLoader } from './loader';
import { ShiftInstanceLoader } from './shift-instance.loader';

@Resolver(() => ShiftInstance)
export class ShiftInstanceFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userMapper: UserMapper,
    private readonly shiftInstanceInviteMapper: ShiftInstanceInviteMapper,
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
  @ResolveField(() => ShiftInstanceInvite, { nullable: true })
  async invites(
    @Parent() instance: ShiftInstanceEntity,
    @Context() context: AuthenticatedGraphQLContext,
    @Args('userId') userId: string,
    @Loader(ShiftInstanceInvitesLoader) loader: ShiftInstanceInvitesLoader,
  ): Promise<ShiftInstanceInvite | null> {
    const invite = await loader.invitesByInstanceId.load({
      organizationUnitId: context.organizationUnitId,
      instanceId: instance.id,
      userId,
    });
    return this.shiftInstanceInviteMapper.toModel(invite);
  }

  @ResolveField(() => Boolean)
  async isCheckedIn(
    @Parent() instance: ShiftInstanceEntity,
    @Session() session: UserSession,
    @Loader(ShiftInstanceLoader) loader: ShiftInstanceLoader,
  ): Promise<boolean> {
    if (!session?.user) {
      return false;
    }

    return loader.isCheckedInByKey.load(`${instance.id}::${session.user.id}`);
  }

  @ResolveField(() => Number)
  async filledCount(
    @Parent() instance: ShiftInstanceEntity,
    @Loader(ShiftInstanceLoader) loader: ShiftInstanceLoader,
  ): Promise<number> {
    return loader.filledCountByInstanceId.load(instance.id);
  }
}
