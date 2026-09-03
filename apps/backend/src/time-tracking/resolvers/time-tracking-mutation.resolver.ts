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
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.addTimeEntry(
      context.organizationUnitId,
      input,
      session.user.id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => TimeEntry)
  async closeTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CloseTimeEntryInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.closeTimeEntry(
      id,
      context.organizationUnitId,
      input,
      session.user.id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => TimeEntry)
  async updateTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTimeEntryInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.updateTimeEntry(
      id,
      context.organizationUnitId,
      input,
      session.user.id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.SHIFT_EDIT)
  @Mutation(() => TimeEntry)
  async deleteTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.deleteTimeEntry(
      context.organizationUnitId,
      id,
      session.user.id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.CHECK_IN_MANAGE)
  @Mutation(() => TimeEntry)
  async checkInVolunteer(
    @Args('volunteerId', { type: () => ID }) volunteerId: string,
    @Args('shiftInstanceId', { type: () => ID, nullable: true })
    shiftInstanceId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.checkInVolunteer(
      context.organizationUnitId,
      volunteerId,
      shiftInstanceId ?? null,
      session.user.id,
    );
    return this.entryMapper.toModelOrThrow(entity);
  }

  // checkIn/checkOut are intentionally NOT @Permissions()-gated: they are
  // volunteer self-service, authorized in the service by membership + an
  // ACCEPTED invite for the current user (not an admin role). The admin path
  // (addTimeEntry) remains permission-gated.
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

  @Permissions(PERMISSIONS.CHECK_IN_MANAGE)
  @Mutation(() => Boolean)
  async checkInInviteToOrganization(
    @Args('volunteerId', { type: () => ID }) volunteerId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<boolean> {
    await this.timeTrackingService.inviteVolunteerToOrganization(
      context.organizationUnitId,
      volunteerId,
    );
    return true;
  }
}
