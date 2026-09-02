import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { createEmailTemplateContext } from '../email/email-template-context';
import { shiftInstanceCancelledTemplate } from '../email/templates/shift-instance-cancelled.template';
import { shiftInstanceInvitedTemplate } from '../email/templates/shift-instance-invited.template';
import { shiftInstanceJoinedTemplate } from '../email/templates/shift-instance-joined.template';
import { shiftInstanceLeftTemplate } from '../email/templates/shift-instance-left.template';
import { shiftInstanceRemovedTemplate } from '../email/templates/shift-instance-removed.template';
import { shiftInstanceSeriesCancelledTemplate } from '../email/templates/shift-instance-series-cancelled.template';
import { shiftInvitedTemplate } from '../email/templates/shift-invited.template';
import { shiftSeriesLeftTemplate } from '../email/templates/shift-series-left.template';
import { shiftSeriesRemovedTemplate } from '../email/templates/shift-series-removed.template';
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

  @OnEvent(NotificationEvent.SHIFT_INSTANCE_REMOVED)
  async handleShiftInstanceRemoved(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_REMOVED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.SHIFT_INSTANCE_REMOVED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInstanceRemovedTemplate(
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

  @OnEvent(NotificationEvent.SHIFT_SERIES_REMOVED)
  async handleShiftSeriesRemoved(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_SERIES_REMOVED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.SHIFT_SERIES_REMOVED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftSeriesRemovedTemplate(
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

  @OnEvent(NotificationEvent.SHIFT_INSTANCE_LEFT)
  async handleShiftInstanceLeft(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_INSTANCE_LEFT],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.SHIFT_INSTANCE_LEFT,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftInstanceLeftTemplate(
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

  @OnEvent(NotificationEvent.SHIFT_SERIES_LEFT)
  async handleShiftSeriesLeft(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.SHIFT_SERIES_LEFT],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.SHIFT_SERIES_LEFT,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return shiftSeriesLeftTemplate(
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
}
