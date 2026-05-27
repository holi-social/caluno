import { Injectable } from '@nestjs/common';
import type { MembershipEntity } from '../membership/schemas/membership.schema';
import type { MembershipRequestEntity } from '../membership/schemas/membership-request.schema';
import type { OrganizationUnitEntity } from '../organization/schemas/organization-unit.schema';
import type { ShiftEntity } from '../shift/schemas/shift.schema';

@Injectable()
export class NotificationService {
  async notifyOrgOfMembershipRequest(
    request: MembershipRequestEntity,
    orgUnit: OrganizationUnitEntity,
  ): Promise<void> {
    this.noop('notifyOrgOfMembershipRequest', {
      requestId: request.id,
      orgUnitId: orgUnit.id,
    });
  }

  async notifyUserMembershipApproved(
    request: MembershipRequestEntity,
  ): Promise<void> {
    this.noop('notifyUserMembershipApproved', {
      requestId: request.id,
      userId: request.userId,
    });
  }

  async notifyUserMembershipRejected(
    request: MembershipRequestEntity,
  ): Promise<void> {
    this.noop('notifyUserMembershipRejected', {
      requestId: request.id,
      userId: request.userId,
    });
  }

  async notifyUserRoleUpgraded(
    membership: MembershipEntity,
    roleIds: string[],
  ): Promise<void> {
    this.noop('notifyUserRoleUpgraded', {
      membershipId: membership.id,
      userId: membership.userId,
      roleIds,
    });
  }

  async notifyUserShiftJoined(
    shift: ShiftEntity,
    userId: string,
  ): Promise<void> {
    this.noop('notifyUserShiftJoined', { shiftId: shift.id, userId });
  }

  private noop(event: string, payload: Record<string, unknown>): void {
    console.log(`[Notification:NOOP] ${event}`, payload);
  }
}
