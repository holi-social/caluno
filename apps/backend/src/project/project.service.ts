import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { UserEntity } from '../auth/schemas/auth.schema';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ForbiddenGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { MembershipService } from '../membership/membership.service';
import type { Task } from '../task/models/task.model';
import { TaskService } from '../task/task.service';
import { UserService } from '../user/user.service';
import { slugify } from '../utils';
import { ProjectStatus } from './enums';
import type { CreateProjectInput } from './inputs/create-project.input';
import { ProjectMapper } from './mappers/project.mapper';
import { type Project, ProjectPaginatedResponse } from './models/project.model';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly mapper: ProjectMapper,
    private readonly userService: UserService,
    private readonly membershipService: MembershipService,
    private readonly taskService: TaskService,
  ) {}

  async findById(id: string): Promise<Project | null> {
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    });
    return this.mapper.toModel(project);
  }

  async findAllByOrganizationId(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<ProjectPaginatedResponse> {
    const projects = await this.db.query.projects.findMany({
      where: eq(schema.projects.organizationId, organizationId),
      limit: pagination.limit,
      offset: pagination.offset,
    });
    return new ProjectPaginatedResponse({
      items: this.mapper.toArray(projects),
      total: projects.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  async findCreator(createdById: string): Promise<UserEntity> {
    return this.userService.findByIdOrThrow(createdById);
  }

  async findTasksByProjectId(projectId: string): Promise<Task[]> {
    return this.taskService.findAllByProjectId(projectId);
  }

  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    const isStaff = await this.membershipService.isStaff(
      userId,
      input.organizationId,
    );

    if (!isStaff) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to create a project for this organization',
      );
    }

    const [project] = await this.db
      .insert(schema.projects)
      .values({
        ...input,
        slug: slugify(input.title),
        createdById: userId,
      })
      .returning();

    return this.mapper.toModelOrThrow(project);
  }

  async publish(userId: string, id: string): Promise<Project> {
    const project = await this.db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    });

    if (!project) {
      throw new NotFoundGraphQLError('Project not found');
    }

    if (project.createdById !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to publish this project',
      );
    }

    const [publishedProject] = await this.db
      .update(schema.projects)
      .set({ status: ProjectStatus.ACTIVE })
      .where(eq(schema.projects.id, id))
      .returning();

    return this.mapper.toModelOrThrow(publishedProject);
  }
}
