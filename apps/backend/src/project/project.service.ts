import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { ForbiddenGraphQLError, NotFoundGraphQLError } from '../graphql/errors';
import type { PaginationInput } from '../graphql/pagination.input';
import { UserService } from '../user/user.service';
import { slugify } from '../utils';
import { ProjectStatus } from './enums';
import type { CreateProjectInput } from './inputs/create-project.input';
import { UpdateProjectInput } from './inputs/update-project.input';
import { ProjectMapper } from './mappers/project.mapper';
import { type Project, ProjectPaginatedResponse } from './models/project.model';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly mapper: ProjectMapper,
    private readonly userService: UserService,
  ) {}

  async findById(id: string): Promise<Project | null> {
    const project = await this.db.query.projects.findFirst({
      where: { id },
    });
    return this.mapper.toModel(project);
  }

  async findAllByOrganizationId(
    organizationId: string,
    pagination: PaginationInput,
  ): Promise<ProjectPaginatedResponse> {
    const projects = await this.db.query.projects.findMany({
      where: { organizationId },
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

  async create(userId: string, input: CreateProjectInput): Promise<Project> {
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

  async update(
    userId: string,
    id: string,
    project: Partial<UpdateProjectInput>,
  ): Promise<Project> {
    const existingProject = await this.db.query.projects.findFirst({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundGraphQLError('Project not found');
    }

    if (existingProject.createdById !== userId) {
      throw new ForbiddenGraphQLError(
        'You are not authorized to update this project',
      );
    }

    const [updatedProject] = await this.db
      .update(schema.projects)
      .set(project)
      .where(eq(schema.projects.id, id))
      .returning();

    return this.mapper.toModelOrThrow(updatedProject);
  }

  async publish(userId: string, id: string): Promise<Project> {
    const project = await this.db.query.projects.findFirst({
      where: { id },
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
