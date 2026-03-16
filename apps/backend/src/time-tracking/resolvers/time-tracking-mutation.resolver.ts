import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AddTimeEntryInput } from '../inputs/add-time-entry.input';
import { ApproveVolunteerSessionInput } from '../inputs/approve-volunteer-session.input';
import { RejectVolunteerSessionInput } from '../inputs/reject-volunteer-session.input';
import { StartVolunteerSessionInput } from '../inputs/start-volunteer-session.input';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import { VolunteerSessionMapper } from '../mappers/volunteer-session.mapper';
import { TimeEntry } from '../models/time-entry.model';
import { VolunteerSession } from '../models/volunteer-session.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver(() => VolunteerSession)
export class TimeTrackingMutationResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly sessionMapper: VolunteerSessionMapper,
    private readonly entryMapper: TimeEntryMapper,
  ) {}

  @Permissions(PERMISSIONS.VOLUNTEER_SESSION_CREATE)
  @Mutation(() => VolunteerSession)
  async startVolunteerSession(
    @Args('input') input: StartVolunteerSessionInput,
    @Session() session: UserSession,
  ): Promise<VolunteerSession> {
    const entity = await this.timeTrackingService.startVolunteerSession(
      session.user.id,
      input,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_SESSION_UPDATE)
  @Mutation(() => VolunteerSession)
  async endVolunteerSession(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<VolunteerSession> {
    const entity = await this.timeTrackingService.endVolunteerSession(
      session.user.id,
      id,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_SESSION_APPROVE)
  @Mutation(() => VolunteerSession)
  async approveVolunteerSession(
    @Args('input') input: ApproveVolunteerSessionInput,
    @Session() session: UserSession,
  ): Promise<VolunteerSession> {
    const entity = await this.timeTrackingService.approveVolunteerSession(
      session.user.id,
      input,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.VOLUNTEER_SESSION_REJECT)
  @Mutation(() => VolunteerSession)
  async rejectVolunteerSession(
    @Args('input') input: RejectVolunteerSessionInput,
    @Session() session: UserSession,
  ): Promise<VolunteerSession> {
    const entity = await this.timeTrackingService.rejectVolunteerSession(
      session.user.id,
      input,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Permissions(PERMISSIONS.TIME_ENTRY_CREATE)
  @Mutation(() => TimeEntry)
  async addTimeEntry(
    @Args('input') input: AddTimeEntryInput,
    @Session() session: UserSession,
  ): Promise<TimeEntry> {
    const entity = await this.timeTrackingService.addTimeEntry(
      session.user.id,
      input,
    );
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
