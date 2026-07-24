import {
  Args,
  Context,
  Int,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Loader } from '../../graphql/decorators';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { MembershipService } from '../../membership/membership.service';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { ShiftInviteStatus } from '../enums';
import { ShiftMapper } from '../mappers/shift.mapper';
import { ShiftInstanceInviteMapper } from '../mappers/shift-instance-invite.mapper';
import { Shift as ShiftModel } from '../models/shift.model';
import { ShiftInstance } from '../models/shift-instance.model';
import { ShiftInstanceInvite } from '../models/shift-instance-invite.model';
import type { ShiftEntity } from '../schemas/shift.schema';
import type { ShiftInstanceEntity } from '../schemas/shift-instance.schema';
import { ShiftService } from '../shift.service';
import { ShiftInstanceInvitesLoader } from './loader';
import { ShiftLoader } from './shift.loader';
import { ShiftInstanceLoader } from './shift-instance.loader';

@Resolver(() => ShiftInstance)
export class ShiftInstanceFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
    private readonly userMapper: UserMapper,
    private readonly shiftInstanceInviteMapper: ShiftInstanceInviteMapper,
    private readonly membershipService: MembershipService,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => ShiftModel)
  async master(
    @Parent()
    instance: ShiftInstanceEntity & {
      master?: ShiftEntity;
    },
    @Loader(ShiftLoader) loader: ShiftLoader,
  ): Promise<ShiftModel> {
    if (instance.master) {
      return this.shiftMapper.toModelOrThrow(instance.master);
    }

    return loader.shiftById.load(instance.masterId);
  }

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
  @ResolveField(() => [ShiftInstanceInvite])
  async invites(
    @Parent() instance: ShiftInstanceEntity,
    @Context() context: AuthenticatedGraphQLContext,
    @Args('statuses', { type: () => [ShiftInviteStatus], nullable: true })
    statuses: ShiftInviteStatus[] | null | undefined,
    @Loader(ShiftInstanceInvitesLoader) loader: ShiftInstanceInvitesLoader,
  ): Promise<ShiftInstanceInvite[]> {
    const invites = await loader.instanceInvitesByKey.load({
      organizationUnitId: context.organizationUnitId,
      instanceId: instance.id,
      statuses,
    });
    return this.shiftInstanceInviteMapper.toArray(invites);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @ResolveField(() => ShiftInstanceInvite, { nullable: true })
  async invite(
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

  @AllowAnonymous()
  @ResolveField(() => Number)
  async filledCount(
    @Parent() instance: ShiftInstanceEntity,
    @Loader(ShiftInstanceLoader) loader: ShiftInstanceLoader,
  ): Promise<number> {
    return loader.filledCountByInstanceId.load(instance.id);
  }

  @AllowAnonymous()
  @ResolveField(() => Int, { nullable: true })
  async spotsLeft(
    @Parent()
    instance: ShiftInstanceEntity & {
      master?: ShiftEntity;
    },
    @Loader(ShiftInstanceLoader) loader: ShiftInstanceLoader,
  ): Promise<number | null> {
    const master =
      instance.master ?? (await this.shiftService.findById(instance.masterId));
    const max = instance.overrideMaxVolunteers ?? master.maxVolunteers ?? null;
    if (max == null) return null;
    const filled = await loader.filledCountByInstanceId.load(instance.id);
    return Math.max(0, max - filled);
  }

  @AllowAnonymous()
  @ResolveField(() => JoinStatus)
  async myJoinStatus(
    @Parent()
    instance: ShiftInstanceEntity & {
      master?: ShiftEntity;
    },
    @Session() session: UserSession,
    @Loader(ShiftInstanceLoader) loader: ShiftInstanceLoader,
  ): Promise<JoinStatus> {
    if (!session?.user) {
      return JoinStatus.NONE;
    }

    const inviteStatus = await loader.myJoinStatusByKey.load(
      `${instance.id}::${session.user.id}`,
    );

    if (inviteStatus !== JoinStatus.NONE) {
      return inviteStatus;
    }

    // No direct invite yet — joining a shift requires org membership, so
    // fall back to the org-level membership request state (mirrors
    // Event.myJoinStatus) rather than always reporting NONE for a
    // non-member with a pending/rejected request.
    const master =
      instance.master ?? (await this.shiftService.findById(instance.masterId));
    const orgState = await this.membershipService.getMembershipState(
      session.user.id,
      master.organizationUnitId,
    );
    return orgState === JoinStatus.PENDING || orgState === JoinStatus.REJECTED
      ? orgState
      : JoinStatus.NONE;
  }
}
