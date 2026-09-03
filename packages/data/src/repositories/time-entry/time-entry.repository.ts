import type {
  AddTimeEntryInput,
  CloseTimeEntryInput,
  GetCheckInContextQuery,
  GetCheckInReadinessQuery,
  GetCheckInVolunteerRequiredFormsQuery,
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

  async findMyTime(options: PaginationOptions = {}) {
    const data = await this.sdk.GetMyTime({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.myTime;
  }

  async getCheckInContext(
    checkInId: string,
  ): Promise<GetCheckInContextQuery['checkInContext']> {
    const data = await this.sdk.GetCheckInContext({ checkInId });
    return data.checkInContext;
  }

  async getCheckInReadiness(
    organizationUnitId: string,
    volunteerId: string,
    shiftInstanceId: string,
  ): Promise<GetCheckInReadinessQuery['checkInReadiness']> {
    const data = await this.sdk.GetCheckInReadiness(
      { volunteerId, shiftInstanceId },
      { 'x-organization-unit-id': organizationUnitId },
    );
    return data.checkInReadiness;
  }

  async getCheckInVolunteerRequiredForms(
    organizationUnitId: string,
    volunteerId: string,
  ): Promise<
    GetCheckInVolunteerRequiredFormsQuery['checkInVolunteerRequiredForms']
  > {
    const data = await this.sdk.GetCheckInVolunteerRequiredForms(
      { volunteerId },
      { 'x-organization-unit-id': organizationUnitId },
    );
    return data.checkInVolunteerRequiredForms;
  }

  /**
   * No header override: this runs from a server action whose
   * `getDataClient({ orgUId })` already scopes every request on this client.
   */
  async checkInVolunteer(
    volunteerId: string,
    shiftInstanceId: string | null,
  ): Promise<{ id: string }> {
    const data = await this.sdk.CheckInVolunteer({
      volunteerId,
      shiftInstanceId,
    });
    return data.checkInVolunteer;
  }

  async checkInInviteToOrganization(
    organizationUnitId: string,
    volunteerId: string,
  ): Promise<boolean> {
    const data = await this.sdk.CheckInInviteToOrganization(
      { volunteerId },
      { 'x-organization-unit-id': organizationUnitId },
    );
    return data.checkInInviteToOrganization;
  }
}
