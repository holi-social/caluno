import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { EventService } from '../event.service';
import { EventMapper } from '../mappers/event.mapper';
import { EventInviteMapper } from '../mappers/event-invite.mapper';
import { Event, EventPaginatedResponse } from '../models/event.model';
import { EventInvite } from '../models/event-invite.model';

@Resolver(() => Event)
export class EventQueryResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly eventMapper: EventMapper,
    private readonly eventInviteMapper: EventInviteMapper,
    private readonly userMapper: UserMapper,
  ) {}

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => Event)
  async event(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Event> {
    const event = await this.eventService.findById(
      id,
      context.organizationUnitId,
    );
    return this.eventMapper.toModelOrThrow(event);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => EventPaginatedResponse)
  async events(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<EventPaginatedResponse> {
    const { events, total } = await this.eventService.findAll(
      context.organizationUnitId,
      pagination,
    );
    return new EventPaginatedResponse({
      items: this.eventMapper.toArray(events),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [EventInvite])
  async eventInvites(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<EventInvite[]> {
    const invites = await this.eventService.findInvites(
      eventId,
      context.organizationUnitId,
    );
    return this.eventInviteMapper.toArray(invites);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [User])
  async eventAttendees(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<User[]> {
    const attendees = await this.eventService.findAttendees(
      eventId,
      context.organizationUnitId,
    );
    return this.userMapper.toArray(attendees);
  }
}
