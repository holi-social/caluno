import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
import { isUUID } from 'class-validator';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { NotFoundGraphQLError } from '../../graphql/errors/not-found.error';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import {
  DateRangePaginationInput,
  PaginationInput,
} from '../../graphql/pagination.input';
import { SortOrder } from '../../shift/enums';
import { ShiftMapper } from '../../shift/mappers/shift.mapper';
import { ShiftPaginatedResponse } from '../../shift/models/shift.model';
import { ShiftService } from '../../shift/shift.service';
import { EventInviteStatus } from '../enums';
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

  @AllowAnonymous()
  @Query(() => Event)
  async publicEvent(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Event> {
    const event = isUUID(id)
      ? await this.eventService.findByIdPublic(id)
      : await this.eventService.findBySlug(id);
    if (!event) {
      throw new NotFoundGraphQLError(`Event with ID ${id} not found`);
    }
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

  @Query(() => EventPaginatedResponse)
  async myEvents(
    @Args('includePast', { type: () => Boolean, defaultValue: false })
    includePast: boolean,
    @Args() pagination: DateRangePaginationInput,
    @Args('order', { type: () => SortOrder, defaultValue: SortOrder.ASC })
    order: SortOrder,
    @Args('statuses', { type: () => [EventInviteStatus], nullable: true })
    statuses: EventInviteStatus[] | null | undefined,
    @Session() session: UserSession,
  ): Promise<EventPaginatedResponse> {
    const { events, total } = await this.eventService.findMyEvents(
      session.user.id,
      includePast,
      pagination.startsAfter,
      pagination.endsBefore,
      pagination.limit,
      pagination.offset,
      order,
      statuses ?? undefined,
    );
    return new EventPaginatedResponse({
      items: this.eventMapper.toArray(events),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Query(() => EventPaginatedResponse)
  async availableEvents(
    @Args() pagination: DateRangePaginationInput,
    @Args('organizationUnitIds', { type: () => [ID], nullable: true })
    organizationUnitIds: string[] | null,
    @Session() session: UserSession,
  ): Promise<EventPaginatedResponse> {
    const { events, total } = await this.eventService.findAvailableEvents(
      session.user.id,
      pagination.startsAfter,
      pagination.endsBefore,
      organizationUnitIds,
      pagination.limit,
      pagination.offset,
    );
    return new EventPaginatedResponse({
      items: this.eventMapper.toArray(events),
      total,
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

  @AllowAnonymous()
  @Query(() => [Event])
  async publicEventsByOrganizationUnit(
    @Args('organizationUnitId', { type: () => ID }) organizationUnitId: string,
  ): Promise<Event[]> {
    const events =
      await this.eventService.findAllPublicByOrgUnit(organizationUnitId);
    return this.eventMapper.toArray(events);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => ShiftPaginatedResponse)
  async eventShifts(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftPaginatedResponse> {
    await this.eventService.findById(eventId, context.organizationUnitId);
    const { shifts, total } = await this.shiftService.findAllForEvent(
      eventId,
      context.organizationUnitId,
      pagination,
    );
    return new ShiftPaginatedResponse({
      items: this.shiftMapper.toArray(shifts),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
