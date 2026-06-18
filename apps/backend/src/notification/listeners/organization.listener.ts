import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import { organizationCreatedTemplate } from '../email/templates/organization-created.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class OrganizationListener {
  private readonly logger = new Logger(OrganizationListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent(NotificationEvent.ORGANIZATION_CREATED)
  async handleOrganizationCreated(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.ORGANIZATION_CREATED],
  ): Promise<void> {
    try {
      const recipient =
        await this.notificationService.resolveUserNotificationData(
          payload.userId,
          {
            event: NotificationEvent.ORGANIZATION_CREATED,
          },
        );
      if (!recipient) {
        return;
      }

      const { subject, html } = await organizationCreatedTemplate({
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
        `Failed to handle ${NotificationEvent.ORGANIZATION_CREATED}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
