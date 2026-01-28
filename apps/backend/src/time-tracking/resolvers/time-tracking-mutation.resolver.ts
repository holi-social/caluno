import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { AddTimeRecordInput } from '../inputs/add-time-record.input';
import { ApproveTimeSessionInput } from '../inputs/approve-time-session.input';
import { RejectTimeSessionInput } from '../inputs/reject-time-session.input';
import { StartTimeSessionInput } from '../inputs/start-time-session.input';
import { TimeRecordMapper } from '../mappers/time-record.mapper';
import { TimeSessionMapper } from '../mappers/time-session.mapper';
import { TimeRecord } from '../models/time-record.model';
import { TimeSession } from '../models/time-session.model';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver(() => TimeSession)
export class TimeTrackingMutationResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly sessionMapper: TimeSessionMapper,
    private readonly recordMapper: TimeRecordMapper,
  ) {}

  @Mutation(() => TimeSession)
  async startTimeSession(
    @Args('input') input: StartTimeSessionInput,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    const entity = await this.timeTrackingService.startTimeSession(
      session.user.id,
      input,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Mutation(() => TimeSession)
  async endTimeSession(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    const entity = await this.timeTrackingService.endTimeSession(
      session.user.id,
      id,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Mutation(() => TimeSession)
  async approveTimeSession(
    @Args('input') input: ApproveTimeSessionInput,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    const entity = await this.timeTrackingService.approveTimeSession(
      session.user.id,
      input,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Mutation(() => TimeSession)
  async rejectTimeSession(
    @Args('input') input: RejectTimeSessionInput,
    @Session() session: UserSession,
  ): Promise<TimeSession> {
    const entity = await this.timeTrackingService.rejectTimeSession(
      session.user.id,
      input,
    );
    return this.sessionMapper.toModelOrThrow(entity);
  }

  @Mutation(() => TimeRecord)
  async addTimeRecord(
    @Args('input') input: AddTimeRecordInput,
    @Session() session: UserSession,
  ): Promise<TimeRecord> {
    const entity = await this.timeTrackingService.addTimeRecord(
      session.user.id,
      input,
    );
    return this.recordMapper.toModelOrThrow(entity);
  }

  @Mutation(() => TimeRecord)
  async deleteTimeRecord(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<TimeRecord> {
    const entity = await this.timeTrackingService.deleteTimeRecord(
      session.user.id,
      id,
    );
    return this.recordMapper.toModelOrThrow(entity);
  }
}
