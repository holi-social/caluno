import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Project } from '../../project/models/project.model';
import { ProjectService } from '../../project/project.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { Shift } from '../models/shift.model';
import type { ShiftEntity } from '../schemas/shift.schema';
import { ShiftService } from '../shift.service';

@Resolver(() => Shift)
export class ShiftFieldResolver {
  constructor(
    private readonly shiftService: ShiftService,
    private readonly projectService: ProjectService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => User)
  async createdBy(@Parent() shift: ShiftEntity): Promise<User> {
    const creator = await this.shiftService.findCreator(shift.createdById);
    return this.userMapper.toModelOrThrow(creator);
  }

  @ResolveField(() => Project, { nullable: true })
  async project(@Parent() shift: ShiftEntity): Promise<Project | null> {
    if (shift.projectId) {
      return this.projectService.findById(shift.projectId);
    } else {
      return Promise.resolve(null);
    }
  }

  @ResolveField(() => User)
  async volunteers(@Parent() shift: ShiftEntity): Promise<User[]> {
    const volunteers = await this.shiftService.findVolunteers(shift.id);
    return this.userMapper.toArray(volunteers);
  }
}
