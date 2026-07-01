import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { createEmailTemplateContext } from '../email/email-template-context';
import { shiftInstanceJoinedTemplate } from '../email/templates/shift-instance-joined.template';
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
}
