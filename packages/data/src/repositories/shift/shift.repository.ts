import {
  parseRruleDays,
  parseRruleEndDate,
  type RecurrenceDayValue,
} from '../../constants';
import { DataError } from '../../errors/data-error';
import type {
  CreateShiftInput,
  GetActiveShiftsQuery,
  GetShiftInstancesQuery,
  GetShiftQuery,
  JoinShiftMutation,
  UpdateShiftInput,
} from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export type ActiveShift = GetActiveShiftsQuery['activeShifts']['items'][number];
export type ShiftInstanceItem =
  GetShiftInstancesQuery['shiftInstances'][number];
export type RawShift = GetShiftQuery['shift'];
export interface ShiftDetail extends RawShift {
  startDate: Date;
  endDate: Date;
  recurrenceDays: RecurrenceDayValue[];
  recurrenceEndsAt: Date | undefined;
}

function enrichShift(shift: RawShift): ShiftDetail {
  const startDate = new Date(shift.originalStartsAt);
  const endDate = new Date(startDate.getTime() + shift.durationMinutes * 60000);

  return {
    ...shift,
    startDate,
    endDate,
    recurrenceDays: parseRruleDays(shift.rrule),
    recurrenceEndsAt: parseRruleEndDate(shift.rrule),
  };
}

export class ShiftRepository extends BaseRepository {
  async findById(id: string): Promise<RawShift> {
    try {
      const data = await this.sdk.GetShift({ id });
      return data.shift;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findByIdDetailed(id: string): Promise<ShiftDetail> {
    const shift = await this.findById(id);
    return enrichShift(shift);
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
      return data.activeShifts.items;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async activeShifts(options: PaginationOptions = {}) {
    try {
      const data = await this.sdk.GetActiveShifts({
        limit: options.limit ?? 100,
        offset: options.offset ?? 0,
      });
      return data.activeShifts;
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

  async inviteMembers(
    shiftId: string,
    memberIds: string[],
  ): Promise<{ id: string }> {
    try {
      const data = await this.sdk.InviteShiftVolunteers({ shiftId, memberIds });
      return { id: data.inviteMembersToShift.id };
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async join(shiftId: string): Promise<JoinShiftMutation['joinShift']> {
    try {
      const data = await this.sdk.JoinShift({ shiftId });
      return data.joinShift;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findVolunteersByShiftId(shiftId: string) {
    try {
      const data = await this.sdk.GetShiftVolunteers({ shiftId });
      return data.shiftVolunteers;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findInstances(shiftId: string) {
    try {
      const data = await this.sdk.GetShiftInstances({ shiftId });
      return data.shiftInstances;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
