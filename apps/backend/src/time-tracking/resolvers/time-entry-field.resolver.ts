import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Project } from '../../project/models/project.model';
import { ShiftMapper } from '../../shift/mappers/shift.mapper';
import { Shift } from '../../shift/models/shift.model';
import { ShiftService } from '../../shift/shift.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { TimeEntry } from '../models/time-entry.model';
import type { TimeEntryEntity } from '../schemas/time-entry.schema';

@Resolver(() => TimeEntry)
export class TimeEntryFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly userService: UserService,
    private readonly userMapper: UserMapper,
    private readonly shiftMapper: ShiftMapper,
  ) {}

  @Permissions(PERMISSIONS.TIME_ENTRY_READ)
  @ResolveField(() => User)
  async volunteer(@Parent() timeEntry: TimeEntryEntity): Promise<User> {
    const creator = await this.userService.findById(timeEntry.volunteerId);
    return this.userMapper.toModelOrThrow(creator);
  }

  @Permissions(PERMISSIONS.TIME_ENTRY_READ)
  @ResolveField(() => Project, { nullable: true })
  async shift(@Parent() timeEntry: TimeEntryEntity): Promise<Shift> {
    const shift = await this.shiftService.findById(timeEntry.shiftId);
    return this.shiftMapper.toModelOrThrow(shift);
  }
}
