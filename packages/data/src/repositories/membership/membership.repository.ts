import { BaseRepository } from '../base/base.repository';

export class MembershipRepository extends BaseRepository {
  async findAllByOrganizationUnitId() {
    const data = await this.sdk.GetOrganizationUnitMemberships();
    return data.memberships;
  }

  async findMine() {
    const data = await this.sdk.MyMemberships();
    return data.myMemberships;
  }

  async findMineById(id: string) {
    const data = await this.sdk.MyMembership({ id });
    return data.myMembership;
  }

  async getMyMembershipStatus(organizationUnitId: string) {
    const data = await this.sdk.GetMyMembershipStatus({ organizationUnitId });
    return data.myMembershipStatus;
  }

  async updateRoles(membershipId: string, roleIds: string[]) {
    const data = await this.sdk.UpdateMembershipRoles({
      membershipId,
      roleIds,
    });
    return data.updateMembershipRoles;
  }

  async leave(membershipId: string) {
    const data = await this.sdk.LeaveMembership({ id: membershipId });
    return data.leaveMembership;
  }

  async remove(membershipId: string) {
    const data = await this.sdk.RemoveMembership({ id: membershipId });
    return data.removeMembership;
  }

  async setIdVerified(
    membershipId: string,
    verified: boolean,
    organizationUnitId?: string,
  ) {
    const data = await this.sdk.SetMembershipIdVerified(
      { membershipId, verified },
      organizationUnitId
        ? { 'x-organization-unit-id': organizationUnitId }
        : undefined,
    );
    return data.setMembershipIdVerified;
  }
}
