import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import { membershipApprovedTemplate } from '../email/templates/membership-approved.template';
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
