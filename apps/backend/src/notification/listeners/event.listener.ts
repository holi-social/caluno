import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { createEmailTemplateContext } from '../email/email-template-context';
import { eventCancelledTemplate } from '../email/templates/event-cancelled.template';
import { eventInvitedTemplate } from '../email/templates/event-invited.template';
import { eventJoinedTemplate } from '../email/templates/event-joined.template';
import { eventRemovedTemplate } from '../email/templates/event-removed.template';
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

  @OnEvent(NotificationEvent.EVENT_JOINED)
  async handleEventJoined(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.EVENT_JOINED],
  ): Promise<void> {
    const volunteer =
      await this.notificationService.resolveUserNotificationData(
        payload.joinedUserId,
        {
          event: NotificationEvent.EVENT_JOINED,
        },
      );
    if (!volunteer) {
      return;
    }

    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.EVENT_JOINED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return eventJoinedTemplate(
          {
            organizationUnitId: payload.organizationUnitId,
            organizationUnitName: payload.organizationUnitName,
            eventTitle: payload.eventTitle,
            volunteerName: volunteer.name,
            recipientFirstName: recipient.firstName,
            startsAt: payload.startsAt,
          },
          templateContext,
        );
      },
    );
  }

  @OnEvent(NotificationEvent.EVENT_CANCELLED)
  async handleEventCancelled(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.EVENT_CANCELLED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.EVENT_CANCELLED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return eventCancelledTemplate(
          {
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

  @OnEvent(NotificationEvent.EVENT_REMOVED)
  async handleEventRemoved(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.EVENT_REMOVED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.EVENT_REMOVED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return eventRemovedTemplate(
          {
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
