import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ShiftMapper } from 'src/shift/mappers/shift.mapper';
import { Shift } from 'src/shift/models/shift.model';
import { TaskMapper } from 'src/task/mappers/task.mapper';
import { Task } from 'src/task/models/task.model';
import { UserMapper } from 'src/user/mappers/user.mapper';
import { User } from 'src/user/models/user.model';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import { TimeEntry } from '../models/time-entry.model';
import { VolunteerSession } from '../models/volunteer-session.model';
import * as volunteerSessionSchema from '../schemas/volunteer-session.schema';
import { TimeTrackingService } from '../time-tracking.service';

@Resolver(() => VolunteerSession)
export class VolunteerSessionFieldResolver {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly entryMapper: TimeEntryMapper,
    private readonly taskMapper: TaskMapper,
    private readonly userMapper: UserMapper,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  @ResolveField(() => [TimeEntry])
  async entries(
    @Parent() volunteerSession: volunteerSessionSchema.VolunteerSessionEntity,
    @Session() session: UserSession,
  ): Promise<TimeEntry[]> {
    const entries = await this.timeTrackingService.findEntriesBySessionId(
      session.user.id,
      volunteerSession.id,
    );
    return this.entryMapper.toArray(entries);
  }

  @ResolveField(() => Task)
  async task(
    @Parent() volunteerSession: volunteerSessionSchema.VolunteerSessionEntity,
    @Session() session: UserSession,
  ): Promise<Task> {
    const task = await this.timeTrackingService.findTaskBySessionId(
      session.user.id,
      volunteerSession.id,
    );
    return this.taskMapper.toModelOrThrow(task);
  }

  @ResolveField(() => User, { nullable: true })
  async validatedBy(
    @Parent() volunteerSession: volunteerSessionSchema.VolunteerSessionEntity,
    @Session() session: UserSession,
  ): Promise<User | null> {
    const validator = await this.timeTrackingService.findValidatorBySessionId(
      session.user.id,
      volunteerSession.id,
    );
    if (!validator) {
      return null;
    }
    return this.userMapper.toModel(validator);
  }

  @ResolveField(() => Shift, { nullable: true })
  async shift(
    @Parent() volunteerSession: volunteerSessionSchema.VolunteerSessionEntity,
    @Session() session: UserSession,
  ): Promise<Shift | null> {
    const shift = await this.timeTrackingService.findShiftBySessionId(
      session.user.id,
      volunteerSession.id,
    );
    if (!shift) {
      return null;
    }
    return this.shiftMapper.toModel(shift);
  }
}
