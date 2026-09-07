import type {
  JoinOrganizationMutation,
  MembershipRequestStatus,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export interface FindMembershipRequestsOptions {
  limit?: number;
  offset?: number;
  status?: MembershipRequestStatus;
}

export class MembershipRequestRepository extends BaseRepository {
  async findAllByOrganizationUnitId(
    options: FindMembershipRequestsOptions = {},
  ) {
    const data = await this.sdk.GetMembershipRequests({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
      status: options.status,
    });
    return data.membershipRequests;
  }

  async getCount(status?: MembershipRequestStatus) {
    const data = await this.sdk.GetMembershipRequestCount({
      status,
    });
    return data.membershipRequestCount;
  }

  async approve(id: string, organizationUnitId: string) {
    const data = await this.sdk.ApproveMembershipRequest({
      id,
      organizationUnitId,
    });
    return data.approveMembershipRequest;
  }

  async checkInApprove(requestId: string, organizationUnitId: string) {
    const data = await this.sdk.CheckInApproveMembershipRequest(
      { requestId },
      { 'x-organization-unit-id': organizationUnitId },
    );
    return data.checkInApproveMembershipRequest;
  }

  async reject(
    id: string,
    organizationUnitId: string,
    rejectionReason: string,
  ) {
    const data = await this.sdk.RejectMembershipRequest({
      id,
      organizationUnitId,
      rejectionReason,
    });
    return data.rejectMembershipRequest;
  }

  async cancel(id: string, organizationUnitId: string) {
    const data = await this.sdk.CancelMembershipRequest({
      id,
      organizationUnitId,
    });
    return data.cancelMembershipRequest;
  }

  async remove(id: string) {
    const data = await this.sdk.RemoveMembershipRequest({ id });
    return data.removeMembershipRequest;
  }

  async findMine(options: { limit?: number; offset?: number } = {}) {
    const data = await this.sdk.GetMyMembershipRequests({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.myMembershipRequests;
  }

  async join(
    organizationUnitId: string,
  ): Promise<JoinOrganizationMutation['joinOrganization']> {
    const data = await this.sdk.JoinOrganization({ organizationUnitId });
    return data.joinOrganization;
  }
}
