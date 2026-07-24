import {
  parseRruleDays,
  parseRruleEndDate,
  type RecurrenceDayValue,
} from '../../constants';
import {
  type CreateShiftInput,
  type GetActiveShiftInstancesQuery,
  type GetAvailableShiftInstancesQuery,
  type GetMyShiftInstancesQuery,
  type GetPublicShiftInstancesQuery,
  type GetShiftInstancesQuery,
  type GetShiftQuery,
  type GetWeeklyShiftsQuery,
  type JoinShiftInstanceMutation,
  type ShiftInviteStatus,
  SortOrder,
  type UpdateShiftInput,
  type UpdateShiftInstanceInviteStatusMutation,
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
  GetMyShiftInstancesQuery['myShiftInstances']['items'][number];
export type AvailableShiftInstance =
  GetAvailableShiftInstancesQuery['availableShiftInstances']['items'][number];
export type PublicShiftInstance =
  GetPublicShiftInstancesQuery['publicShiftInstances'][number];
export type RawPublicShiftInstance =
  GetPublicShiftInstancesQuery['publicShiftInstances'];
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

  async findPublicInstancesByShiftId(
    shiftId: string,
  ): Promise<PublicShiftInstance[]> {
    const data = await this.sdk.GetPublicShiftInstances({ shiftId });
    return data.publicShiftInstances;
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

  async findAllForEvent(eventId: string, options: PaginationOptions = {}) {
    const data = await this.sdk.GetEventShifts({
      eventId,
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.eventShifts;
  }

  async findInstancesByMasterIds(masterIds: string[]) {
    const data = await this.sdk.GetShiftInstancesByMasterIds({ masterIds });
    return data.shiftInstancesByMasterIds;
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

  async findVolunteersByInstanceId(
    instanceId: string,
    statuses?: ShiftInviteStatus[],
  ) {
    const data = await this.sdk.GetShiftVolunteers({ instanceId, statuses });
    return data.shiftVolunteers;
  }

  async findInstanceDetail(shiftId: string, instanceId: string) {
    const data = await this.sdk.GetShiftInstanceDetail({ shiftId });
    return data.shiftInstances.find((instance) => instance.id === instanceId);
  }

  async updateInstanceInviteStatus(
    instanceId: string,
    status: ShiftInviteStatus,
    userId?: string,
  ) {
    const data = await this.sdk.UpdateShiftInstanceInviteStatus({
      instanceId,
      status,
      userId,
    });
    return data.updateShiftInstanceInviteStatus;
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

  async findMyShiftInstances(
    options: {
      includePast?: boolean;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
      order?: SortOrder;
      statuses?: ShiftInviteStatus[];
    } = {},
  ): Promise<{
    items: MyShiftInstance[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const data = await this.sdk.GetMyShiftInstances({
      includePast: options.includePast ?? false,
      startsAfter: options.from?.toISOString(),
      endsBefore: options.to?.toISOString(),
      limit: options.limit ?? 15,
      offset: options.offset ?? 0,
      order: options.order ?? SortOrder.Asc,
      statuses: options.statuses,
    });
    return data.myShiftInstances;
  }

  async findAvailableShiftInstances(
    options: {
      from?: Date;
      to?: Date;
      organizationUnitIds?: string[];
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{
    items: AvailableShiftInstance[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const data = await this.sdk.GetAvailableShiftInstances({
      startsAfter: options.from?.toISOString(),
      endsBefore: options.to?.toISOString(),
      organizationUnitIds: options.organizationUnitIds,
      limit: options.limit ?? 15,
      offset: options.offset ?? 0,
    });
    return data.availableShiftInstances;
  }

  async updateShiftInstanceInviteStatus(
    instanceId: string,
    status: ShiftInviteStatus,
  ): Promise<
    UpdateShiftInstanceInviteStatusMutation['updateShiftInstanceInviteStatus']
  > {
    const data = await this.sdk.UpdateShiftInstanceInviteStatus({
      instanceId,
      status,
    });
    return data.updateShiftInstanceInviteStatus;
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
