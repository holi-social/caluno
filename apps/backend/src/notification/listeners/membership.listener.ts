import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email/email.service';
import { membershipRequestedTemplate } from '../email/templates/membership-requested.template';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class MembershipListener {
  private readonly logger = new Logger(MembershipListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(NotificationEvent.MEMBERSHIP_REQUESTED)
  async handleMembershipRequested(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.MEMBERSHIP_REQUESTED],
  ): Promise<void> {
    if (payload.recipients.length === 0) {
      return;
    }

    const appUrl = this.configService.get<string>('WEB_URL');

    await Promise.all(
      payload.recipients.map(async (recipient) => {
        try {
          const { subject, html } = await membershipRequestedTemplate(
            payload,
            recipient.firstName,
            { appUrl },
          );
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
}
