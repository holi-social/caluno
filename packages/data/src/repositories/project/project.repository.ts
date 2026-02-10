import { ZodError } from 'zod';
import { DataError } from '../../errors/data-error';
import type { CreateProjectInput } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';
import { validateCreateProjectInput } from './project.validation';

export interface FindProjectsOptions {
  limit?: number;
  offset?: number;
}

export class ProjectRepository extends BaseRepository {
  async findById(id: string) {
    try {
      const data = await this.sdk.GetProject({ id });
      return data.project;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAllByOrganizationId(
    organizationId: string,
    options: FindProjectsOptions = {},
  ) {
    try {
      const data = await this.sdk.GetProjects({
        organizationId,
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
      });
      return data.projects;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async create(input: CreateProjectInput) {
    try {
      const data = await this.sdk.CreateProject({ input });
      return data.createProject;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  validateCreateProjectInput(input: CreateProjectInput) {
    return validateCreateProjectInput(input);
  }
}
