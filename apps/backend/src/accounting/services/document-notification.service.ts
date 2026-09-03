import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { NotificationService } from '../../notification/notification.service';
import { DocumentKind } from '../enums';

interface DocumentNotificationInput {
  organizationId: string;
  volunteerUserId: string;
  documentId: string;
  documentKind: DocumentKind;
}

/**
 * Bridges document lifecycle events to the notification system. The
 * volunteer is only ever told about the two things that ask something of
 * them (see accounting-volunteer-documents): a document waiting for their
 * signature, and the organisation declining one they had already signed.
 * Generation and final countersignature settle quietly.
 */
@Injectable()
export class DocumentNotificationService {
  private readonly logger = new Logger(DocumentNotificationService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly notificationService: NotificationService,
  ) {}

  async notifyAwaitingVolunteerSignature(
    input: DocumentNotificationInput,
  ): Promise<void> {
    try {
      const organization = await this.db.query.organizations.findFirst({
        where: { id: input.organizationId },
        columns: { name: true },
      });
      this.notificationService.notifyDocumentAwaitingSignature({
        volunteerUserId: input.volunteerUserId,
        documentId: input.documentId,
        documentKind: input.documentKind,
        organizationName: organization?.name ?? '',
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit awaiting-signature notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async notifyDeclinedByOrg(
    input: DocumentNotificationInput & { reason: string },
  ): Promise<void> {
    try {
      const organization = await this.db.query.organizations.findFirst({
        where: { id: input.organizationId },
        columns: { name: true },
      });
      this.notificationService.notifyDocumentDeclinedByOrg({
        volunteerUserId: input.volunteerUserId,
        documentId: input.documentId,
        documentKind: input.documentKind,
        organizationName: organization?.name ?? '',
        reason: input.reason,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit declined-by-org notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
