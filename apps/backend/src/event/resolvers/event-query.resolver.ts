import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { ShiftMapper } from '../../shift/mappers/shift.mapper';
import { Shift } from '../../shift/models/shift.model';
import { ShiftService } from '../../shift/shift.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { EventService } from '../event.service';
import { EventMapper } from '../mappers/event.mapper';
import { Event, EventPaginatedResponse } from '../models/event.model';

@Resolver(() => Event)
export class EventQueryResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly eventMapper: EventMapper,
    private readonly userMapper: UserMapper,
    private readonly shiftService: ShiftService,
    private readonly shiftMapper: ShiftMapper,
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

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => [Shift])
  async eventShifts(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<Shift[]> {
    await this.eventService.findById(eventId, context.organizationUnitId);
    const shifts = await this.shiftService.findByEventId(eventId);
    return this.shiftMapper.toArray(shifts);
  }
}
