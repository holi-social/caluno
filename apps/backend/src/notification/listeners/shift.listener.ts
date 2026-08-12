import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { createEmailTemplateContext } from '../email/email-template-context';
import { shiftInstanceCancelledTemplate } from '../email/templates/shift-instance-cancelled.template';
import { shiftInstanceInvitedTemplate } from '../email/templates/shift-instance-invited.template';
import { shiftInstanceJoinedTemplate } from '../email/templates/shift-instance-joined.template';
import { shiftInstanceSeriesCancelledTemplate } from '../email/templates/shift-instance-series-cancelled.template';
import { shiftInvitedTemplate } from '../email/templates/shift-invited.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class ShiftListener {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly appI18n: AppI18nService,
  ) {}

  @OnEvent(NotificationEvent.SHIFT_INSTANCE_JOINED)
  async handleShiftInstanceJoined(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_JOINED],
  ): Promise<void> {
    const volunteer =
      await this.notificationService.resolveUserNotificationData(
        payload.joinedUserId,
        {
          event: NotificationEvent.SHIFT_INSTANCE_JOINED,
        },
      );
    if (!volunteer) {
      return;
    }

    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.SHIFT_INSTANCE_JOINED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInstanceJoinedTemplate(
          {
            organizationUnitId: payload.organizationUnitId,
            organizationUnitName: payload.organizationUnitName,
            shiftTitle: payload.shiftTitle,
            volunteerName: volunteer.name,
            recipientFirstName: recipient.firstName,
            startsAt: payload.startsAt,
          },
          templateContext,
        );
      },
    );
  }

  @OnEvent(NotificationEvent.SHIFT_INSTANCE_INVITED)
  async handleShiftInstanceInvited(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_INVITED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.SHIFT_INSTANCE_INVITED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInstanceInvitedTemplate(
          {
            organizationUnitName: payload.organizationUnitName,
            shiftId: payload.shiftId,
            shiftTitle: payload.shiftTitle,
            shiftLocation: payload.shiftLocation,
            shiftInstructions: payload.shiftInstructions,
            recipientFirstName: recipient.firstName,
            startsAt: payload.startsAt,
            endsAt: payload.endsAt,
            instanceId: payload.instanceId,
          },
          templateContext,
        );
      },
    );
  }

  @OnEvent(NotificationEvent.SHIFT_INSTANCE_CANCELLED)
  async handleShiftInstanceCancelled(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_CANCELLED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.SHIFT_INSTANCE_CANCELLED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInstanceCancelledTemplate(
          {
            organizationUnitName: payload.organizationUnitName,
            shiftTitle: payload.shiftTitle,
            shiftLocation: payload.shiftLocation,
            recipientFirstName: recipient.firstName,
            startsAt: payload.startsAt,
            endsAt: payload.endsAt,
          },
          templateContext,
        );
      },
    );
  }

  @OnEvent(NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED)
  async handleShiftInstanceSeriesCancelled(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.SHIFT_INSTANCE_SERIES_CANCELLED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInstanceSeriesCancelledTemplate(
          {
            organizationUnitName: payload.organizationUnitName,
            shiftTitle: payload.shiftTitle,
            shiftLocation: payload.shiftLocation,
            recipientFirstName: recipient.firstName,
            fromDate: payload.fromDate,
          },
          templateContext,
        );
      },
    );
  }

  @OnEvent(NotificationEvent.SHIFT_INVITED)
  async handleShiftInvited(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INVITED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.recipientUserIds,
      {
        event: NotificationEvent.SHIFT_INVITED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInvitedTemplate(
          {
            organizationUnitName: payload.organizationUnitName,
            shiftId: payload.shiftId,
            shiftTitle: payload.shiftTitle,
            shiftLocation: payload.shiftLocation,
            shiftInstructions: payload.shiftInstructions,
            recipientFirstName: recipient.firstName,
            schedule: payload.schedule,
          },
          templateContext,
        );
      },
    );
  }
}
