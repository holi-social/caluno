import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { TimeSession } from '../models/time-session.model';
import { TimeTrackingService } from '../time-tracking.service';
import * as timeSessionSchema from '../schemas/time-session.schema';
import { TimeRecord } from '../models/time-record.model';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { Task } from 'src/task/models/task.model';
import { User } from 'src/user/models/user.model';

@Resolver(() => TimeSession)
export class TimeSessionFieldResolver {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @ResolveField(() => [TimeRecord])
  async records(
    @Parent() timeSession: timeSessionSchema.TimeSessionEntity,
    @Session() session: UserSession,
  ): Promise<TimeRecord[]> {
    return this.timeTrackingService.findRecordsBySessionId(
      session.user.id,
      timeSession.id,
    );
  }

  @ResolveField(() => Task)
  async task(
    @Parent() timeSession: timeSessionSchema.TimeSessionEntity,
    @Session() session: UserSession,
  ): Promise<Task> {
    return this.timeTrackingService.findTaskBySessionId(
      session.user.id,
      timeSession.id,
    );
  }

  @ResolveField(() => User, { nullable: true })
  async validatedBy(
    @Parent() timeSession: timeSessionSchema.TimeSessionEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    return this.timeTrackingService.findValidatorBySessionId(
      session.user.id,
      timeSession.id,
    );
  }
}
