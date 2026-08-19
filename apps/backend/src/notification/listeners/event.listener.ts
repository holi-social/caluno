import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { createEmailTemplateContext } from '../email/email-template-context';
import { eventInvitedTemplate } from '../email/templates/event-invited.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class EventListener {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly appI18n: AppI18nService,
  ) {}

  @OnEvent(NotificationEvent.EVENT_INVITED)
  async handleEventInvited(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.EVENT_INVITED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.EVENT_INVITED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return eventInvitedTemplate(
          {
            eventId: payload.eventId,
            organizationUnitName: payload.organizationUnitName,
            eventTitle: payload.eventTitle,
            eventLocation: payload.eventLocation,
            recipientFirstName: recipient.firstName,
            startsAt: payload.startsAt,
            endsAt: payload.endsAt,
          },
          templateContext,
        );
      },
    );
  }
}
