import {
  parseRruleDays,
  parseRruleEndDate,
  type RecurrenceDayValue,
} from '../../constants';
import type {
  CreateShiftInput,
  GetActiveShiftInstancesQuery,
  GetAvailableShiftInstancesQuery,
  GetMyShiftInstancesQuery,
  GetShiftInstancesQuery,
  GetShiftQuery,
  GetWeeklyShiftsQuery,
  JoinShiftInstanceMutation,
  UpdateShiftInput,
} from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export type ActiveShiftInstance =
  GetActiveShiftInstancesQuery['activeShiftInstances'][number];
export type ShiftInstanceItem =
  GetShiftInstancesQuery['shiftInstances'][number];
export type RawShift = GetShiftQuery['shift'];
export type WeeklyShiftInstance = GetWeeklyShiftsQuery['weeklyShifts'][number];
export type MyShiftInstance =
  GetMyShiftInstancesQuery['myShiftInstances'][number];
export type AvailableShiftInstance =
  GetAvailableShiftInstancesQuery['availableShiftInstances'][number];
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

  async activeShiftInstances(userId: string) {
    const data = await this.sdk.GetActiveShiftInstances({ userId });
    return data.activeShiftInstances;
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

  async updateMembers(
    instanceId: string,
    memberIds: string[],
    options?: { inviteToAllInstances?: boolean },
  ): Promise<{ id: string }> {
    const data = await this.sdk.UpdateMembersForShiftInstance({
      instanceId,
      memberIds,
      inviteToAllInstances: options?.inviteToAllInstances,
    });
    return { id: data.updateMembersForShiftInstance.id };
  }

  async joinInstance(
    instanceId: string,
  ): Promise<JoinShiftInstanceMutation['joinShiftInstance']> {
    const data = await this.sdk.JoinShiftInstance({ instanceId });
    return data.joinShiftInstance;
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

  async findMyShiftInstances(includePast = false): Promise<MyShiftInstance[]> {
    const data = await this.sdk.GetMyShiftInstances({ includePast });
    return data.myShiftInstances;
  }

  async findAvailableShiftInstances(
    options: { from?: Date; to?: Date; organizationUnitIds?: string[] } = {},
  ): Promise<AvailableShiftInstance[]> {
    const data = await this.sdk.GetAvailableShiftInstances({
      from: options.from?.toISOString(),
      to: options.to?.toISOString(),
      organizationUnitIds: options.organizationUnitIds,
    });
    return data.availableShiftInstances;
  }

  async checkIn(shiftInstanceId: string): Promise<string> {
    const data = await this.sdk.CheckIn({ shiftInstanceId });
    return data.checkIn.id;
  }

  async checkOut(shiftInstanceId: string): Promise<string> {
    const data = await this.sdk.CheckOut({ shiftInstanceId });
    return data.checkOut.id;
  }
}
