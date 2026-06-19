import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { organizationCreatedTemplate } from '../email/templates/organization-created.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class OrganizationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(NotificationEvent.ORGANIZATION_CREATED)
  async handleOrganizationCreated(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.ORGANIZATION_CREATED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.ORGANIZATION_CREATED,
      },
      async (recipient) =>
        await organizationCreatedTemplate({
          organizationUnitId: payload.organizationUnitId,
          organizationName: payload.organizationName,
          recipientFirstName: recipient.firstName,
        }),
    );
  }
}
