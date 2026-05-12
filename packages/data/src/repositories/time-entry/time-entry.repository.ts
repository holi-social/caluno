import { DataError } from '../../errors/data-error';
import type {
  AddTimeEntryInput,
  CloseTimeEntryInput,
  GetTimeEntryQuery,
  UpdateTimeEntryInput,
} from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export type TimeEntryDetail = GetTimeEntryQuery['timeEntry'];

export class TimeEntryRepository extends BaseRepository {
  async findById(id: string): Promise<TimeEntryDetail> {
    try {
      const data = await this.sdk.GetTimeEntry({ id });
      return data.timeEntry;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

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

  async close(id: string, input: CloseTimeEntryInput) {
    try {
      const data = await this.sdk.CloseTimeEntry({ id, input });
      return data.closeTimeEntry;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async update(id: string, input: UpdateTimeEntryInput) {
    try {
      const data = await this.sdk.UpdateTimeEntry({ id, input });
      return data.updateTimeEntry;
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

  async findByUser(userId: string, options: PaginationOptions = {}) {
    try {
      const data = await this.sdk.GetTimeEntriesByUser({
        userId,
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
      });
      return data.timeEntriesByUser;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
