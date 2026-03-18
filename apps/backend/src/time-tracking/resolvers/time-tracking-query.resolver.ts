import { Context, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import { TimeEntry } from '../models/time-entry.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver()
export class TimeTrackingQueryResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly timeEntryMapper: TimeEntryMapper,
  ) {}

  @Permissions(PERMISSIONS.TIME_ENTRY_READ)
  @Query(() => [TimeEntry])
  async timeEntries(
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry[]> {
    const sessions = await this.timeTrackingService.findEntries(
      context.organizationId,
    );
    return this.timeEntryMapper.toArray(sessions);
  }
}
