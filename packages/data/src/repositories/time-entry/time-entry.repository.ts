import { DataError } from '../../errors/data-error';
import type { AddTimeEntryInput } from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export class TimeEntryRepository extends BaseRepository {
  async add(input: AddTimeEntryInput) {
    try {
      const data = await this.sdk.AddTimeEntry({ input });
      return data.addTimeEntry;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async delete(id: string) {
    try {
      const data = await this.sdk.DeleteTimeEntry({ id });
      return data.deleteTimeEntry;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAll(options: PaginationOptions = {}) {
    try {
      const data = await this.sdk.GetTimeEntries({
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
      });
      return data.timeEntries;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
