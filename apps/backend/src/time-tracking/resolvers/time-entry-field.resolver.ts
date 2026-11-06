import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from '../../graphql/decorators/loader.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { OrganizationUnit } from '../../organization/models/organization-unit.model';
import { ShiftInstanceMapper } from '../../shift/mappers/shift-instance.mapper';
import { ShiftInstance } from '../../shift/models/shift-instance.model';
import { ShiftService } from '../../shift/shift.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { UserService } from '../../user/user.service';
import { TimeEntry } from '../models/time-entry.model';
import type {
  TimeEntryEntity,
  TimeEntryEntityWithRelations,
} from '../schemas/time-entry.schema';
import { TimeEntryLoader } from './time-entry.loader';

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

  @ResolveField(() => ShiftInstance, { nullable: true })
  async shiftInstance(
    @Parent() timeEntry: TimeEntryEntityWithRelations,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ShiftInstance | null> {
    if (!timeEntry.shiftInstanceId) {
      return null;
    }

    if (timeEntry.shiftInstance) {
      return this.shiftInstanceMapper.toModelOrThrow(timeEntry.shiftInstance);
    }

    const instance = await this.shiftService.findInstanceById(
      timeEntry.shiftInstanceId,
      context.organizationUnitId,
    );
    return this.shiftInstanceMapper.toModelOrThrow(instance);
  }

  @ResolveField(() => OrganizationUnit)
  async organizationUnit(
    @Parent() timeEntry: TimeEntryEntity,
    @Loader(TimeEntryLoader) loader: TimeEntryLoader,
  ): Promise<OrganizationUnit> {
    return loader.organizationUnitById.load(timeEntry.organizationUnitId);
  }
}
