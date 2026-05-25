import { fromGraphQLError } from '../../errors/translate';
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
      throw fromGraphQLError(error);
    }
  }

  async add(input: AddTimeEntryInput) {
    try {
      const data = await this.sdk.AddTimeEntry({ input });
      return data.addTimeEntry;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async delete(id: string) {
    try {
      const data = await this.sdk.DeleteTimeEntry({ id });
      return data.deleteTimeEntry;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async close(id: string, input: CloseTimeEntryInput) {
    try {
      const data = await this.sdk.CloseTimeEntry({ id, input });
      return data.closeTimeEntry;
    } catch (error) {
      throw fromGraphQLError(error);
    }
  }

  async update(id: string, input: UpdateTimeEntryInput) {
    try {
      const data = await this.sdk.UpdateTimeEntry({ id, input });
      return data.updateTimeEntry;
    } catch (error) {
      throw fromGraphQLError(error);
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
      throw fromGraphQLError(error);
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
      throw fromGraphQLError(error);
    }
  }
}
