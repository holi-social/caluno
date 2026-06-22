import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import {
  type MyTimeEntryEntity,
  MyTimeEntryPaginatedResponse,
  mapToMyTimeEntry,
} from '../models/my-time-entry.model';
import {
  TimeEntry,
  TimeEntryPaginatedResponse,
} from '../models/time-entry.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver(() => TimeEntry)
export class TimeTrackingQueryResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly timeEntryMapper: TimeEntryMapper,
  ) {}

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => TimeEntry)
  async timeEntry(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry> {
    const entry = await this.timeTrackingService.findById(
      id,
      context.organizationUnitId,
    );
    return this.timeEntryMapper.toModelOrThrow(entry);
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => TimeEntryPaginatedResponse)
  async timeEntries(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntryPaginatedResponse> {
    const { entries, total } = await this.timeTrackingService.findAll(
      context.organizationUnitId,
      pagination,
    );
    return new TimeEntryPaginatedResponse({
      items: this.timeEntryMapper.toArray(entries),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Permissions(PERMISSIONS.SHIFT_VIEW)
  @Query(() => TimeEntryPaginatedResponse)
  async timeEntriesByUser(
    @Args('userId') userId: string,
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntryPaginatedResponse> {
    const { entries, total } = await this.timeTrackingService.findByUser(
      context.organizationUnitId,
      userId,
      pagination,
    );
    return new TimeEntryPaginatedResponse({
      items: this.timeEntryMapper.toArray(entries),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  // Volunteering "My Time" — auth-only (no @Permissions, no org scope): the
  // current user's entries across every organisation. userId comes from the
  // session, never from an argument.
  @Query(() => MyTimeEntryPaginatedResponse)
  async myTimeEntries(
    @Args() pagination: PaginationInput,
    @Session() session: UserSession,
  ): Promise<MyTimeEntryPaginatedResponse> {
    const { entries, total } = await this.timeTrackingService.findMyEntries(
      session.user.id,
      pagination,
    );
    return new MyTimeEntryPaginatedResponse({
      items: entries.map((entry) =>
        mapToMyTimeEntry(entry as unknown as MyTimeEntryEntity),
      ),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
