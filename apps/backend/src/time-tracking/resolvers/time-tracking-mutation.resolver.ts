import { Args, Context, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { type AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { AddTimeEntryInput } from '../inputs/add-time-entry.input';
import { CloseTimeEntryInput } from '../inputs/close-time-enty-input';
import { UpdateTimeEntryInput } from '../inputs/update-time-entry.input';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import { TimeEntry } from '../models/time-entry.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver()
export class TimeTrackingMutationResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly entryMapper: TimeEntryMapper,
  ) {}

  @Permissions(PERMISSIONS.SHIFT_EDIT)
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

  @Permissions(PERMISSIONS.SHIFT_EDIT)
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

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => TimeEntry)
  async updateTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTimeEntryInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.updateTimeEntry(
      id,
      context.organizationUnitId,
      input,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
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

  @Mutation(() => TimeEntry)
  async checkIn(
    @Args('shiftInstanceId', { type: () => ID }) shiftInstanceId: string,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.checkIn(
      shiftInstanceId,
      session.user.id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Mutation(() => TimeEntry)
  async checkOut(
    @Args('shiftInstanceId', { type: () => ID }) shiftInstanceId: string,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.checkOut(
      shiftInstanceId,
      session.user.id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }
}
