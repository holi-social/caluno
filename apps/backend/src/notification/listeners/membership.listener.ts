import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import { membershipApprovedTemplate } from '../email/templates/membership-approved.template';
import { membershipRequestedTemplate } from '../email/templates/membership-requested.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class MembershipListener {
  private readonly logger = new Logger(MembershipListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent(NotificationEvent.MEMBERSHIP_REQUESTED)
  async handleMembershipRequested(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_REQUESTED],
  ): Promise<void> {
    if (payload.recipientUserIds.length === 0) {
      return;
    }

    const requester =
      await this.notificationService.resolveUserNotificationData(
        payload.requesterUserId,
      );
    if (!requester) {
      this.logger.warn(
        `Skipping ${NotificationEvent.MEMBERSHIP_REQUESTED}: requester ${payload.requesterUserId} not found`,
      );
      return;
    }

    const recipients =
      await this.notificationService.resolveUsersNotificationData(
        payload.recipientUserIds,
      );

    await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const { subject, html } = await membershipRequestedTemplate({
            organizationUnitId: payload.organizationUnitId,
            organizationUnitName: payload.organizationUnitName,
            requesterName: requester.name,
            recipientFirstName: recipient.firstName,
          });
          await this.emailService.send({
            to: recipient.email,
            subject,
            html,
          });
        } catch (error) {
          this.logger.error(
            `Failed to handle ${NotificationEvent.MEMBERSHIP_REQUESTED} for ${recipient.email}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }),
    );
  }

  @OnEvent(NotificationEvent.MEMBERSHIP_APPROVED)
  async handleMembershipApproved(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_APPROVED],
  ): Promise<void> {
    try {
      const recipient =
        await this.notificationService.resolveUserNotificationData(
          payload.userId,
        );
      if (!recipient) {
        this.logger.warn(
          `Skipping ${NotificationEvent.MEMBERSHIP_APPROVED}: user ${payload.userId} not found`,
        );
        return;
      }

      const { subject, html } = await membershipApprovedTemplate({
        organizationUnitId: payload.organizationUnitId,
        organizationName: payload.organizationName,
        recipientFirstName: recipient.firstName,
      });
      await this.emailService.send({
        to: recipient.email,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle ${NotificationEvent.MEMBERSHIP_APPROVED}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
