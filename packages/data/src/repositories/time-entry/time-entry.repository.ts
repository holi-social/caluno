import type {
  AddTimeEntryInput,
  CloseTimeEntryInput,
  GetMyTimeEntriesQuery,
  GetTimeEntryQuery,
  UpdateTimeEntryInput,
} from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export type TimeEntryDetail = GetTimeEntryQuery['timeEntry'];

export type MyTimeEntryItem =
  GetMyTimeEntriesQuery['myTimeEntries']['items'][number];

export class TimeEntryRepository extends BaseRepository {
  async findById(id: string): Promise<TimeEntryDetail> {
    const data = await this.sdk.GetTimeEntry({ id });
    return data.timeEntry;
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

  async findMyEntries(options: PaginationOptions = {}) {
    const data = await this.sdk.GetMyTimeEntries({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.myTimeEntries;
  }
}
