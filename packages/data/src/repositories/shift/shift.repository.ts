import {
  parseRruleDays,
  parseRruleEndDate,
  type RecurrenceDayValue,
} from '../../constants';
import type {
  CreateShiftInput,
  GetActiveShiftsQuery,
  GetShiftInstancesQuery,
  GetShiftQuery,
  GetWeeklyShiftsQuery,
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
export type WeeklyShiftInstance = GetWeeklyShiftsQuery['weeklyShifts'][number];
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
    const data = await this.sdk.GetShift({ id });
    return data.shift;
  }

  async findByIdDetailed(id: string): Promise<ShiftDetail> {
    const shift = await this.findById(id);
    return enrichShift(shift);
  }

  async findAll(options: PaginationOptions = {}) {
    const data = await this.sdk.GetShifts({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.shifts;
  }

  async findAllForTimeEntryCreation(options: PaginationOptions = {}) {
    const data = await this.sdk.GetShiftsForTimeEntryCreation({
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    });
    return data.activeShifts.items;
  }

  async activeShifts(options: PaginationOptions = {}) {
    const data = await this.sdk.GetActiveShifts({
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    });
    return data.activeShifts;
  }

  async create(input: CreateShiftInput) {
    const data = await this.sdk.CreateShift({ input });
    return data.createShift;
  }

  async update(id: string, input: UpdateShiftInput) {
    const data = await this.sdk.UpdateShift({ id, input });
    return data.updateShift;
  }

  async delete(id: string): Promise<{ id: string }> {
    const data = await this.sdk.DeleteShift({ id });
    return { id: data.deleteShift.id };
  }

  async inviteMembers(
    instanceId: string,
    memberIds: string[],
  ): Promise<{ id: string }> {
    const data = await this.sdk.InviteShiftInstanceVolunteers({
      instanceId,
      memberIds,
    });
    return { id: data.inviteMembersToShiftInstance.id };
  }

  async join(instanceId: string): Promise<JoinShiftMutation['joinShift']> {
    const data = await this.sdk.JoinShift({ instanceId });
    return data.joinShift;
  }

  async findVolunteersByInstanceId(instanceId: string) {
    const data = await this.sdk.GetShiftVolunteers({ instanceId });
    return data.shiftVolunteers;
  }

  async findInstances(shiftId: string) {
    const data = await this.sdk.GetShiftInstances({ shiftId });
    return data.shiftInstances;
  }

  async findForWeek(from: Date, to: Date): Promise<WeeklyShiftInstance[]> {
    const data = await this.sdk.GetWeeklyShifts({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    return data.weeklyShifts;
  }
}
