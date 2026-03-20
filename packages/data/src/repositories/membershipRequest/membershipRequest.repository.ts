import { DataError } from '../../errors/data-error';
import type { MembershipRequestStatus } from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export interface FindMembershipRequestsOptions {
  limit?: number;
  offset?: number;
  status?: MembershipRequestStatus;
}

export class MembershipRequestRepository extends BaseRepository {
  async findAllByOrganizationId(
    organizationId: string,
    options: FindMembershipRequestsOptions = {},
  ) {
    try {
      const data = await this.sdk.GetMembershipRequests({
        organizationId,
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
        status: options.status,
      });
      return data.membershipRequests;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async create(organizationId: string) {
    try {
      const data = await this.sdk.CreateMembershipRequest({ organizationId });
      return data.createMembershipRequest;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async approve(id: string, organizationId: string) {
    try {
      const data = await this.sdk.ApproveMembershipRequest({
        id,
        organizationId,
      });
      return data.approveMembershipRequest;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async reject(id: string, organizationId: string, rejectionReason: string) {
    try {
      const data = await this.sdk.RejectMembershipRequest({
        id,
        organizationId,
        rejectionReason,
      });
      return data.rejectMembershipRequest;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async cancel(id: string, organizationId: string) {
    try {
      const data = await this.sdk.CancelMembershipRequest({
        id,
        organizationId,
      });
      return data.cancelMembershipRequest;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
