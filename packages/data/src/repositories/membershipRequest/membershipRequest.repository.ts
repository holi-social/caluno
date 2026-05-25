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
    organizationUnitId: string,
    options: FindMembershipRequestsOptions = {},
  ) {
    const data = await this.sdk.GetMembershipRequests({
      organizationUnitId,
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
      status: options.status,
    });
    return data.membershipRequests;
  }

  async approve(id: string, organizationUnitId: string) {
    const data = await this.sdk.ApproveMembershipRequest({
      id,
      organizationUnitId,
    });
    return data.approveMembershipRequest;
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

  async findMine(options: FindMembershipRequestsOptions = {}) {
    const data = await this.sdk.GetMyMembershipRequests({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
      status: options.status,
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
