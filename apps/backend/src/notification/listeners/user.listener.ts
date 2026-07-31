import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { createEmailTemplateContext } from '../email/email-template-context';
import { welcomeTemplate } from '../email/templates/welcome.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class UserListener {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly appI18n: AppI18nService,
  ) {}

  @OnEvent(NotificationEvent.USER_EMAIL_VERIFIED)
  async handleUserEmailVerified(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.USER_EMAIL_VERIFIED],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.userId,
      {
        event: NotificationEvent.USER_EMAIL_VERIFIED,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return welcomeTemplate(
          {
            recipientFirstName: recipient.firstName,
          },
          templateContext,
        );
      },
    );
  }
}
