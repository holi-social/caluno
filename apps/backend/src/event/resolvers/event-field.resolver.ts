import { Int, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { Loader } from '../../graphql/decorators/loader.decorator';
import { MembershipService } from '../../membership/membership.service';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import { RequiredFormRefMapper } from '../../requirement-profile/mappers/required-form-ref.mapper';
import { JoinStatus } from '../../shared/enums/join-status.enum';
import { isParticipatingInvite } from '../../shared/invite-status';
import { Shift } from '../../shift/models/shift.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { EventInviteStatus } from '../enums';
import { Event } from '../models/event.model';
import { EventOrganizationUnit } from '../models/event-organization-unit.model';
import type { EventEntity } from '../schemas/event.schema';
import { EventInviteLoader } from './event-invite.loader';
import { EventInviteCountLoader } from './event-invite-count.loader';
import { EventOrganizationUnitLoader } from './event-organization-unit.loader';
import { EventOrganizerLoader } from './event-organizer.loader';
import { EventRequiredFormsLoader } from './event-required-forms.loader';
import { EventShiftsLoader } from './loader';

@Resolver(() => Event)
export class EventFieldResolver {
  constructor(
    private readonly userMapper: UserMapper,
    private readonly membershipService: MembershipService,
    private readonly requiredFormRefMapper: RequiredFormRefMapper,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => User, { nullable: true })
  async organizer(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
    @Loader(EventOrganizerLoader) loader: EventOrganizerLoader,
  ): Promise<User | null> {
    if (!session?.user) {
      return null;
    }

    const organizer = await loader.userById.load(event.createdById);
    return organizer ? this.userMapper.toModelOrThrow(organizer) : null;
  }

  @AllowAnonymous()
  @ResolveField(() => Int)
  async shiftsCount(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
    @Session() session: UserSession,
  ): Promise<number> {
    return loader.countByEventId.load({
      eventId: event.id,
      userId: session?.user?.id,
    });
  }

  @AllowAnonymous()
  @ResolveField(() => Int)
  async requiredFormsCount(
    @Parent() event: EventEntity,
    @Loader(EventRequiredFormsLoader) loader: EventRequiredFormsLoader,
  ): Promise<number> {
    return loader.countByEventId.load(event.id);
  }

  @AllowAnonymous()
  @ResolveField(() => Int)
  async signedUpCount(
    @Parent() event: EventEntity,
    @Loader(EventInviteCountLoader) loader: EventInviteCountLoader,
  ): Promise<number> {
    return loader.countByEventId.load(event.id);
  }

  /**
   * Full membership-aware join state for the event. Replaces the older
   * `isFollowing` boolean by also surfacing pending/rejected membership.
   */
  @AllowAnonymous()
  @ResolveField(() => JoinStatus)
  async myJoinStatus(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
    @Loader(EventInviteLoader) loader: EventInviteLoader,
  ): Promise<JoinStatus> {
    if (!session?.user) {
      return JoinStatus.NONE;
    }

    const invite = await loader.inviteByEventIdAndUserId.load(
      `${event.id}:${session.user.id}`,
    );
    if (invite && isParticipatingInvite(invite.origin, invite.status)) {
      return JoinStatus.JOINED;
    }
    if (
      invite?.status === EventInviteStatus.ADMIN_REJECTED ||
      invite?.status === EventInviteStatus.ADMIN_CANCELLED
    ) {
      return JoinStatus.REJECTED;
    }

    const membershipState = await this.membershipService.getMembershipState(
      session.user.id,
      event.organizationUnitId,
    );

    if (membershipState === JoinStatus.REJECTED) {
      return JoinStatus.REJECTED;
    }

    if (membershipState === JoinStatus.PENDING) {
      const requests = await this.membershipService.getMyMembershipRequests(
        session.user.id,
      );
      const request = requests.find(
        (r) => r.organizationUnitId === event.organizationUnitId,
      );
      const intendedEventIds =
        request?.metadata &&
        typeof request.metadata === 'object' &&
        'intendedEventIds' in request.metadata &&
        Array.isArray(request.metadata.intendedEventIds)
          ? request.metadata.intendedEventIds
          : [];
      if (intendedEventIds.includes(event.id)) {
        return JoinStatus.PENDING;
      }
    }

    return JoinStatus.NONE;
  }

  @AllowAnonymous()
  @ResolveField(() => Date, { nullable: true })
  async myInvitedAt(
    @Parent() event: EventEntity,
    @Session() session: UserSession,
    @Loader(EventInviteLoader) loader: EventInviteLoader,
  ): Promise<Date | null> {
    if (!session?.user) {
      return null;
    }
    const invite = await loader.inviteByEventIdAndUserId.load(
      `${event.id}:${session.user.id}`,
    );
    return invite?.createdAt ?? null;
  }

  @AllowAnonymous()
  @ResolveField(() => [Shift])
  async shifts(
    @Parent() event: EventEntity,
    @Loader(EventShiftsLoader) loader: EventShiftsLoader,
    @Session() session: UserSession,
  ): Promise<Shift[]> {
    return loader.shiftsByEventId.load({
      eventId: event.id,
      userId: session?.user?.id,
    });
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

  @AllowAnonymous()
  @ResolveField(() => [RequiredFormRef])
  async requiredForms(
    @Parent() event: EventEntity,
    @Loader(EventRequiredFormsLoader) loader: EventRequiredFormsLoader,
  ): Promise<RequiredFormRef[]> {
    const requiredForms = await loader.requiredFormsByEventId.load(event.id);

    return this.requiredFormRefMapper.toArray(requiredForms);
  }
}
