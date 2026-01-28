import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Task } from '../../task/models/task.model';
import { User } from '../../user/models/user.model';
import { UserMapper } from '../../user/mappers/user.mapper';
import { Project } from '../models/project.model';
import { ProjectService } from '../project.service';
import type { ProjectEntity } from '../schemas/project.schema';

@Resolver(() => Project)
export class ProjectFieldResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userMapper: UserMapper,
  ) {}

  @ResolveField(() => User)
  async createdBy(@Parent() project: ProjectEntity): Promise<User> {
    const creator = await this.projectService.findCreator(project.createdById);
    return this.userMapper.toModelOrThrow(creator);
  }

  @ResolveField(() => [Task])
  async tasks(@Parent() project: ProjectEntity): Promise<Task[]> {
    return this.projectService.findTasksByProjectId(project.id);
  }
}
