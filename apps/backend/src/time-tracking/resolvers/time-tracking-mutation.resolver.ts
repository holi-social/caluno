import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { type AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { AddTimeEntryInput } from '../inputs/add-time-entry.input';
import { CloseTimeEntryInput } from '../inputs/close-time-enty-input';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import { TimeEntry } from '../models/time-entry.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver()
export class TimeTrackingMutationResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly entryMapper: TimeEntryMapper,
  ) {}

  @Permissions(PERMISSIONS.TIME_ENTRY_CREATE)
  @Mutation(() => TimeEntry)
  async addTimeEntry(
    @Args('input') input: AddTimeEntryInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.addTimeEntry(
      context.organizationUnitId,
      input,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.TIME_ENTRY_UPDATE)
  @Mutation(() => TimeEntry)
  async closeTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CloseTimeEntryInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.closeTimeEntry(
      id,
      context.organizationUnitId,
      input,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.TIME_ENTRY_DELETE)
  @Mutation(() => TimeEntry)
  async deleteTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.deleteTimeEntry(
      context.organizationUnitId,
      id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }
}
