import { DataError } from '../../errors/data-error';
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
    try {
      const data = await this.sdk.GetMembershipRequests({
        organizationUnitId,
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
        status: options.status,
      });
      return data.membershipRequests;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async approve(id: string, organizationUnitId: string) {
    try {
      const data = await this.sdk.ApproveMembershipRequest({
        id,
        organizationUnitId,
      });
      return data.approveMembershipRequest;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async reject(
    id: string,
    organizationUnitId: string,
    rejectionReason: string,
  ) {
    try {
      const data = await this.sdk.RejectMembershipRequest({
        id,
        organizationUnitId,
        rejectionReason,
      });
      return data.rejectMembershipRequest;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async cancel(id: string, organizationUnitId: string) {
    try {
      const data = await this.sdk.CancelMembershipRequest({
        id,
        organizationUnitId,
      });
      return data.cancelMembershipRequest;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findMine(options: FindMembershipRequestsOptions = {}) {
    try {
      const data = await this.sdk.GetMyMembershipRequests({
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
        status: options.status,
      });
      return data.myMembershipRequests;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async join(
    organizationUnitId: string,
  ): Promise<JoinOrganizationMutation['joinOrganization']> {
    try {
      const data = await this.sdk.JoinOrganization({ organizationUnitId });
      return data.joinOrganization;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
