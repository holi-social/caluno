import { DataError } from '../../errors/data-error';
import type { CreateShiftInput } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export interface PagginationOptions {
  limit?: number;
  offset?: number;
}

export class ShiftRepository extends BaseRepository {
  async create(input: CreateShiftInput) {
    try {
      const data = await this.sdk.CreateShift({ input });
      return data.createShift;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAllByProjectId(
    projectId: string,
    options: PagginationOptions = {},
  ) {
    try {
      const data = await this.sdk.GetShiftsByProjectId({
        projectId,
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
      });
      return data.shiftsByProjectId;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
