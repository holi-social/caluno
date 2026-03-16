import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PaginationInput } from '../../graphql/pagination.input';
import { Project, ProjectPaginatedResponse } from '../models/project.model';
import { ProjectService } from '../project.service';

@Resolver(() => Project)
export class ProjectQueryResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Permissions(PERMISSIONS.PROJECT_READ)
  @Query(() => Project)
  async project(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Project | null> {
    return this.projectService.findById(id);
  }

  @Permissions(PERMISSIONS.PROJECT_READ)
  @Query(() => ProjectPaginatedResponse)
  async projects(
    @Args('organizationId', { type: () => ID }) organizationId: string,
    @Args() pagination: PaginationInput,
  ): Promise<ProjectPaginatedResponse> {
    return this.projectService.findAllByOrganizationId(
      organizationId,
      pagination,
    );
  }
}
