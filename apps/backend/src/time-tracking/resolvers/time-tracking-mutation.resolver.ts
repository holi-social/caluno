import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AddTimeEntryInput } from '../inputs/add-time-entry.input';
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
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.addTimeEntry(input);
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.TIME_ENTRY_DELETE)
  @Mutation(() => TimeEntry)
  async deleteTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.deleteTimeEntry(
      session.user.id,
      id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }
}
