import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
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

  @Permissions(PERMISSIONS.TIME_ENTRY_READ)
  @Query(() => TimeEntryPaginatedResponse)
  async timeEntries(
    @Args() pagination: PaginationInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntryPaginatedResponse> {
    const { entries, total } = await this.timeTrackingService.findAll(
      context.organizationId,
      pagination,
    );
    return new TimeEntryPaginatedResponse({
      items: this.timeEntryMapper.toArray(entries),
      total: total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
