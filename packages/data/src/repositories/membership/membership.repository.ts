import { BaseRepository } from '../base/base.repository';

export class MembershipRepository extends BaseRepository {
  async findAllByOrganizationUnitId() {
    const data = await this.sdk.GetOrganizationUnitMemberships();
    return data.memberships;
  }

  async updateRoles(membershipId: string, roleIds: string[]) {
    const data = await this.sdk.UpdateMembershipRoles({
      membershipId,
      roleIds,
    });
    return data.updateMembershipRoles;
  }
}
