import { DataError } from '../../errors/data-error';
import type { AddTimeEntryInput, TimeEntry } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class TimeEntryRepository extends BaseRepository {
  async add(input: AddTimeEntryInput): Promise<TimeEntry> {
    try {
      const data = await this.sdk.AddTimeEntry({ input });
      return data.addTimeEntry;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async delete(id: string): Promise<TimeEntry> {
    try {
      const data = await this.sdk.DeleteTimeEntry({ id });
      return data.deleteTimeEntry;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
