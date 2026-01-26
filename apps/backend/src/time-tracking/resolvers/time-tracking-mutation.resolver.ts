import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { AddTimeRecordInput } from '../inputs/add-time-record.input';
import { ApproveTimeSessionInput } from '../inputs/approve-time-session.input';
import { RejectTimeSessionInput } from '../inputs/reject-time-session.input';
import { StartTimeSessionInput } from '../inputs/start-time-session.input';
import { TimeRecord } from '../models/time-record.model';
import { TimeSession } from '../models/time-session.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver(() => TimeSession)
export class TimeTrackingMutationResolver {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Mutation(() => TimeSession)
  async startTimeSession(
    @Args('input') input: StartTimeSessionInput,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    return this.timeTrackingService.startTimeSession(session.user.id, input);
  }

  @Mutation(() => TimeSession)
  async endTimeSession(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    return this.timeTrackingService.endTimeSession(session.user.id, id);
  }

  @Mutation(() => TimeSession)
  async approveTimeSession(
    @Args('input') input: ApproveTimeSessionInput,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    return this.timeTrackingService.approveTimeSession(session.user.id, input);
  }

  @Mutation(() => TimeSession)
  async rejectTimeSession(
    @Args('input') input: RejectTimeSessionInput,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    return this.timeTrackingService.rejectTimeSession(session.user.id, input);
  }

  @Mutation(() => TimeRecord)
  async addTimeRecord(
    @Args('input') input: AddTimeRecordInput,
    @Session() session: UserSession,
  ): Promise<TimeRecord> {
    return this.timeTrackingService.addTimeRecord(session.user.id, input);
  }

  @Mutation(() => TimeRecord)
  async deleteTimeRecord(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<TimeRecord> {
    return this.timeTrackingService.deleteTimeRecord(session.user.id, id);
  }
}
