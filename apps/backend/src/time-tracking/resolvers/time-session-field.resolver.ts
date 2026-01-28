import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { TaskMapper } from 'src/task/mappers/task.mapper';
import { Task } from 'src/task/models/task.model';
import { UserMapper } from 'src/user/mappers/user.mapper';
import { User } from 'src/user/models/user.model';
import { TimeRecordMapper } from '../mappers/time-record.mapper';
import { TimeRecord } from '../models/time-record.model';
import { TimeSession } from '../models/time-session.model';
import * as timeSessionSchema from '../schemas/time-session.schema';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver(() => TimeSession)
export class TimeSessionFieldResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly recordMapper: TimeRecordMapper,
    private readonly taskMapper: TaskMapper,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => [TimeRecord])
  async records(
    @Parent() timeSession: timeSessionSchema.TimeSessionEntity,
    @Session() session: UserSession,
  ): Promise<TimeRecord[]> {
    const records = await this.timeTrackingService.findRecordsBySessionId(
      session.user.id,
      timeSession.id,
    );
    return this.recordMapper.toArray(records);
  }

  @ResolveField(() => Task)
  async task(
    @Parent() timeSession: timeSessionSchema.TimeSessionEntity,
    @Session() session: UserSession,
  ): Promise<Task> {
    const task = await this.timeTrackingService.findTaskBySessionId(
      session.user.id,
      timeSession.id,
    );
    return this.taskMapper.toModelOrThrow(task);
  }

  @ResolveField(() => User, { nullable: true })
  async validatedBy(
    @Parent() timeSession: timeSessionSchema.TimeSessionEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    const validator = await this.timeTrackingService.findValidatorBySessionId(
      session.user.id,
      timeSession.id,
    );
    if (!validator) {
      return null;
    }
    return this.userMapper.toModel(validator);
  }
}
