import { DataError } from '../../errors/data-error';
import type { CreateShiftInput } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class ShiftRepository extends BaseRepository {
  async findById(id: string) {
    try {
      const data = await this.sdk.GetShift({ id });
      return data.shift;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async create(input: CreateShiftInput) {
    try {
      const data = await this.sdk.CreateShift({ input });
      return data.createShift;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
