import { DataError } from '../../errors/data-error';
import type {
  CreateShiftInput,
  UpdateShiftInput,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export class ShiftRepository extends BaseRepository {
  async findById(id: string) {
    try {
      const data = await this.sdk.GetShift({ id });
      return data.shift;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAll(options: PaginationOptions = {}) {
    try {
      const data = await this.sdk.GetShifts({
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
      });
      return data.shifts;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAllForTimeEntryCreation(options: PaginationOptions = {}) {
    try {
      const data = await this.sdk.GetShiftsForTimeEntryCreation({
        limit: options.limit ?? 100,
        offset: options.offset ?? 0,
      });
      return data.shifts.items;
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

  async findAllByProjectId(projectId: string, options: PaginationOptions = {}) {
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

  async update(id: string, input: UpdateShiftInput) {
    try {
      const data = await this.sdk.UpdateShift({ id, input });
      return data.updateShift;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async delete(id: string): Promise<{ id: string }> {
    try {
      const data = await this.sdk.DeleteShift({ id });
      return { id: data.deleteShift.id };
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
