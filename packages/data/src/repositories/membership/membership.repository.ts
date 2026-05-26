import { DataError } from '../../errors/data-error';
import { BaseRepository } from '../base/base.repository';

export class MembershipRepository extends BaseRepository {
  async findAllByOrganizationUnitId() {
    try {
      const data = await this.sdk.GetOrganizationUnitMemberships();
      return data.memberships;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async updateRoles(membershipId: string, roleIds: string[]) {
    try {
      const data = await this.sdk.UpdateMembershipRoles({
        membershipId,
        roleIds,
      });
      return data.updateMembershipRoles;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
