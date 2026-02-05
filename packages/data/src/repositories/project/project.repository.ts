import { DataError } from '../../errors/data-error';
import type { CreateProjectInput } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export interface FindProjectsOptions {
  limit?: number;
  offset?: number;
}

export class ProjectRepository extends BaseRepository {
  async create(input: CreateProjectInput) {
    try {
      const data = await this.sdk.CreateProject({ input });
      return data.createProject;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
