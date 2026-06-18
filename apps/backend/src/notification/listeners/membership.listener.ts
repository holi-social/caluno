import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { membershipApprovedTemplate } from '../email/templates/membership-approved.template';
import { membershipRequestedTemplate } from '../email/templates/membership-requested.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class MembershipListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(NotificationEvent.MEMBERSHIP_REQUESTED)
  async handleMembershipRequested(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_REQUESTED],
  ): Promise<void> {
    const requester =
      await this.notificationService.resolveUserNotificationData(
        payload.requesterUserId,
        {
          event: NotificationEvent.MEMBERSHIP_REQUESTED,
        },
      );
    if (!requester) {
      return;
    }

    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.MEMBERSHIP_REQUESTED,
      },
      async (recipient) =>
        await membershipRequestedTemplate({
          organizationUnitId: payload.organizationUnitId,
          organizationUnitName: payload.organizationUnitName,
          requesterName: requester.name,
          recipientFirstName: recipient.firstName,
        }),
    );
  }

  @OnEvent(NotificationEvent.MEMBERSHIP_APPROVED)
  async handleMembershipApproved(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_APPROVED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.MEMBERSHIP_APPROVED,
      },
      async (recipient) =>
        await membershipApprovedTemplate({
          organizationUnitId: payload.organizationUnitId,
          organizationName: payload.organizationName,
          recipientFirstName: recipient.firstName,
        }),
    );
  }
}
