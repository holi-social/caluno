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
  async findById(id: string): Promise<TimeEntryDetail | null> {
    try {
      const data = await this.sdk.GetTimeEntry({ id });
      return data.timeEntry;
    } catch (error) {
      if (
        error instanceof DataError &&
        error.message === 'Time entry not found'
      ) {
        return null;
      }
      throw error;
    }
  }

  async add(input: AddTimeEntryInput) {
    const data = await this.sdk.AddTimeEntry({ input });
    return data.addTimeEntry;
  }

  async delete(id: string) {
    const data = await this.sdk.DeleteTimeEntry({ id });
    return data.deleteTimeEntry;
  }

  async close(id: string, input: CloseTimeEntryInput) {
    const data = await this.sdk.CloseTimeEntry({ id, input });
    return data.closeTimeEntry;
  }

  async update(id: string, input: UpdateTimeEntryInput) {
    const data = await this.sdk.UpdateTimeEntry({ id, input });
    return data.updateTimeEntry;
  }

  async findAll(options: PaginationOptions = {}) {
    const data = await this.sdk.GetTimeEntries({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.timeEntries;
  }

  async findByUser(userId: string, options: PaginationOptions = {}) {
    const data = await this.sdk.GetTimeEntriesByUser({
      userId,
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.timeEntriesByUser;
  }

  async findMyTime(options: PaginationOptions = {}) {
    const data = await this.sdk.GetMyTime({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.myTime;
  }
}
