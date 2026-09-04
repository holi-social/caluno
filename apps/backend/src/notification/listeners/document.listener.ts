import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DocumentKind } from '../../accounting/enums';
import type { Locale } from '../../graphql/locale';
import { AppI18nService } from '../../i18n/app-i18n.service';
import { createEmailTemplateContext } from '../email/email-template-context';
import { documentAwaitingSignatureTemplate } from '../email/templates/document-awaiting-signature.template';
import { documentDeclinedByOrgTemplate } from '../email/templates/document-declined-by-org.template';
import { NotificationService } from '../notification.service';
import type { NotificationEventPayloadMap } from '../notification-event-map';
import { NotificationEvent } from '../notification-events';

@Injectable()
export class DocumentListener {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly appI18n: AppI18nService,
  ) {}

  private documentName(locale: Locale, kind: DocumentKind): string {
    const { t } = this.appI18n.createTranslator(locale, 'email');
    return t(
      kind === DocumentKind.CONTRACT
        ? 'documentNames.agreement'
        : 'documentNames.timesheet',
    );
  }

  @OnEvent(NotificationEvent.DOCUMENT_AWAITING_SIGNATURE)
  async handleDocumentAwaitingSignature(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.DOCUMENT_AWAITING_SIGNATURE],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.volunteerUserId,
      {
        event: NotificationEvent.DOCUMENT_AWAITING_SIGNATURE,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return documentAwaitingSignatureTemplate(
          {
            organizationName: payload.organizationName,
            recipientFirstName: recipient.firstName,
            documentName: this.documentName(
              recipient.locale,
              payload.documentKind,
            ),
          },
          templateContext,
        );
      },
    );
  }

  @OnEvent(NotificationEvent.DOCUMENT_DECLINED_BY_ORG)
  async handleDocumentDeclinedByOrg(
    payload: NotificationEventPayloadMap[typeof NotificationEvent.DOCUMENT_DECLINED_BY_ORG],
  ): Promise<void> {
    await this.notificationService.sendNotification(
      payload.volunteerUserId,
      {
        event: NotificationEvent.DOCUMENT_DECLINED_BY_ORG,
      },
      async (recipient) => {
        const templateContext = createEmailTemplateContext(
          this.appI18n,
          recipient.locale,
        );
        return documentDeclinedByOrgTemplate(
          {
            organizationName: payload.organizationName,
            recipientFirstName: recipient.firstName,
            documentName: this.documentName(
              recipient.locale,
              payload.documentKind,
            ),
            reason: payload.reason,
          },
          templateContext,
        );
      },
    );
  }
}
