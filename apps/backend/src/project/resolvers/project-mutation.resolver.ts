import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { Session } from '@thallesp/nestjs-better-auth';
import { CreateProjectInput } from '../inputs/create-project.input';
import { UpdateProjectInput } from '../inputs/update-project.input';
import { Project } from '../models/project.model';
import { ProjectService } from '../project.service';

@Resolver(() => Project)
export class ProjectMutationResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Mutation(() => Project)
  async createProject(
    @Args('input') input: CreateProjectInput,
    @Session() session: UserSession,
  ): Promise<Project> {
    return this.projectService.create(session.user.id, input);
  }

  @Mutation(() => Project)
  async publishProject(
    @Args('id', { type: () => ID }) id: string,
    @Session() session: UserSession,
  ): Promise<Project> {
    return this.projectService.publish(session.user.id, id);
  }

  @Mutation(() => Project)
  async updateProject(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProjectInput,
    @Session() session: UserSession,
  ): Promise<Project> {
    return this.projectService.update(session.user.id, id, input);
  }
}
