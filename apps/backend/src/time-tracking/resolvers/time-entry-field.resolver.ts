import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { ShiftInstanceMapper } from '../../shift/mappers/shift-instance.mapper';
import { ShiftInstance } from '../../shift/models/shift-instance.model';
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
    private readonly shiftInstanceMapper: ShiftInstanceMapper,
  ) {}

  @ResolveField(() => User)
  async volunteer(@Parent() timeEntry: TimeEntryEntity): Promise<User> {
    const creator = await this.userService.findById(timeEntry.volunteerId);
    return this.userMapper.toModelOrThrow(creator);
  }

  @ResolveField(() => ShiftInstance)
  async shiftInstance(
    @Parent() timeEntry: TimeEntryEntity,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance> {
    const instance = await this.shiftService.findInstanceById(
      timeEntry.shiftInstanceId,
      context.organizationUnitId,
    );
    return this.shiftInstanceMapper.toModelOrThrow(instance);
  }
}
