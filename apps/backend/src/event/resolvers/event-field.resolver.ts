import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { MembershipService } from '../../membership/membership.service';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { Shift } from '../../shift/models/shift.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { EventInviteStatus } from '../enums';
import { EventService } from '../event.service';
import { Event } from '../models/event.model';
import { EventOrganizationUnit } from '../models/event-organization-unit.model';
import type { EventEntity } from '../schemas/event.schema';
import { EventOrganizationUnitLoader } from './event-organization-unit.loader';
import { EventShiftsLoader } from './loader';

@Resolver(() => Event)
export class EventFieldResolver {
  constructor(
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
    private readonly eventService: EventService,
    private readonly membershipService: MembershipService,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => User, { nullable: true })
  async organizer(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    if (!session?.user) {
      return null;
    }

    const organizer = await this.userService.findByIdOrThrow(event.createdById);
    return this.userMapper.toModelOrThrow(organizer);
  }

  @AllowAnonymous()
  @ResolveField(() => Int)
  async shiftsCount(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
  ): Promise<number> {
    return loader.countByEventId.load(event.id);
  }

  @AllowAnonymous()
  @ResolveField(() => JoinStatus)
  async myJoinStatus(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
  ): Promise<JoinStatus> {
    if (!session?.user) return JoinStatus.NONE;

    const invite = await this.eventService.findInvite(
      event.id,
      session.user.id,
    );

    if (invite?.status === EventInviteStatus.ACCEPTED) {
      return JoinStatus.JOINED;
    }

    // Joining an event requires org membership — pending/rejected reflects
    // the org-level membership request, since events don't have their own
    // pending/rejected invite state (joinEvent only ever writes ACCEPTED).
    // An existing org membership on its own doesn't mean the user has
    // followed this event, so it's deliberately not mapped to JOINED here.
    const orgState = await this.membershipService.getMembershipState(
      session.user.id,
      event.organizationUnitId,
    );
    return orgState === JoinStatus.PENDING || orgState === JoinStatus.REJECTED
      ? orgState
      : JoinStatus.NONE;
  }

  @AllowAnonymous()
  @ResolveField(() => [Shift])
  async shifts(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
  ): Promise<Shift[]> {
    return loader.shiftsByEventId.load(event.id);
  }

  @AllowAnonymous()
  @ResolveField(() => String, { nullable: true })
  coverImageUrl(@Parent() event: EventEntity): string | null {
    return event.coverUrl ?? null;
  }

  @AllowAnonymous()
  @ResolveField(() => EventOrganizationUnit, { nullable: true })
  async organizationUnit(
    @Parent() event: EventEntity,
    @Loader(EventOrganizationUnitLoader) loader: EventOrganizationUnitLoader,
  ): Promise<EventOrganizationUnit | null> {
    return loader.organizationUnitById.load(event.organizationUnitId);
  }
}
