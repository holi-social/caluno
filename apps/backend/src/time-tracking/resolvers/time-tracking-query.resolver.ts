import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { PaginationInput } from '../../graphql/pagination.input';
import { OrganizationUnitMapper } from '../../organization/mappers/organization-unit.mapper';
import { UserMapper } from '../../user/mappers/user.mapper';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import { CheckInContext } from '../models/check-in-context.model';
import { CheckInReadiness } from '../models/check-in-readiness.model';
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
    private readonly userMapper: UserMapper,
    private readonly organizationUnitMapper: OrganizationUnitMapper,
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

  @Permissions(PERMISSIONS.CHECK_IN_MANAGE)
  @Query(() => CheckInReadiness)
  async checkInReadiness(
    @Args('volunteerId', { type: () => ID }) volunteerId: string,
    @Args('shiftInstanceId', { type: () => ID }) shiftInstanceId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<CheckInReadiness> {
    return this.timeTrackingService.getCheckInReadiness(
      volunteerId,
      shiftInstanceId,
      context.organizationUnitId,
    );
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

  // Cross-org-unit check-in context: intentionally NOT @Permissions()-gated
  // (like checkIn/checkOut); the service intersects the caller's
  // check-in:manage units with the volunteer's memberships.
  @Query(() => CheckInContext, { nullable: true })
  async checkInContext(
    @Args('checkInId') checkInId: string,
    @Session() session: UserSession,
  ): Promise<CheckInContext | null> {
    const context = await this.timeTrackingService.getCheckInContext(
      session.user.id,
      checkInId,
    );
    if (!context) {
      return null;
    }

    return {
      volunteer: this.userMapper.toModelOrThrow(context.volunteer),
      eligibleOrganizationUnits: this.organizationUnitMapper.toArray(
        context.eligibleOrganizationUnits,
      ),
      openTimeEntries: this.timeEntryMapper.toArray(context.openTimeEntries),
    };
  }

  @Query(() => TimeEntryPaginatedResponse)
  async myTime(
    @Session() session: UserSession,
    @Args() pagination: PaginationInput,
  ): Promise<TimeEntryPaginatedResponse> {
    const { entries, total } = await this.timeTrackingService.findMyTime(
      session.user.id,
      pagination,
    );
    return new TimeEntryPaginatedResponse({
      items: this.timeEntryMapper.toArray(entries),
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }
}
