import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { UserMapper } from '../../user/mappers/user.mapper';
import { User } from '../../user/models/user.model';
import { Project } from '../models/project.model';
import { ProjectService } from '../project.service';
import type { ProjectEntity } from '../schemas/project.schema';

@Resolver(() => Project)
export class ProjectFieldResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userMapper: UserMapper,
  ) {}

  @Permissions(PERMISSIONS.PROJECT_READ)
  @ResolveField(() => User)
  async createdBy(@Parent() project: ProjectEntity): Promise<User> {
    const creator = await this.projectService.findCreator(project.createdById);
    return this.userMapper.toModelOrThrow(creator);
  }
}
