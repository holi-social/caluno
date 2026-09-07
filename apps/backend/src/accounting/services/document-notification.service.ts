import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { PERMISSIONS } from '../../auth/constants';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { NotificationService } from '../../notification/notification.service';
import { OrganizationService } from '../../organization/organization.service';
import { DocumentKind } from '../enums';

interface DocumentNotificationInput {
  organizationId: string;
  volunteerUserId: string;
  documentId: string;
  documentKind: DocumentKind;
}

interface DocumentDeclinedByVolunteerInput {
  organizationId: string;
  volunteerUserId: string;
  documentId: string;
  documentKind: DocumentKind;
  reason: string;
}

/**
 * Bridges document lifecycle events to the notification system. The
 * volunteer is only ever told about the two things that ask something of
 * them (see accounting-volunteer-documents): a document waiting for their
 * signature, and the organisation declining one they had already signed.
 * Generation and final countersignature settle quietly. The admin side is
 * the mirror image: they only need to hear about a decline that is theirs
 * to act on (VOLI-1246) — a volunteer declining their own document.
 */
@Injectable()
export class DocumentNotificationService {
  private readonly logger = new Logger(DocumentNotificationService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
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

  async notifyDeclinedByVolunteer(
    input: DocumentDeclinedByVolunteerInput,
  ): Promise<void> {
    try {
      const rootUnit = await this.organizationService.findRootUnit(
        input.organizationId,
      );
      if (!rootUnit) {
        this.logger.warn(
          `Skipping declined-by-volunteer notification: no root unit for organization ${input.organizationId}`,
        );
        return;
      }

      const [organization, volunteer, recipients] = await Promise.all([
        this.db.query.organizations.findFirst({
          where: { id: input.organizationId },
          columns: { name: true },
        }),
        this.db.query.users.findFirst({
          where: { id: input.volunteerUserId },
          columns: { name: true },
        }),
        this.authService.findUsersWithPermission(
          rootUnit.id,
          PERMISSIONS.ACCOUNTING_MANAGE,
        ),
      ]);

      const recipientUserIds = recipients
        .filter((recipient) => recipient.id !== input.volunteerUserId)
        .map((recipient) => recipient.id);

      if (recipientUserIds.length === 0) {
        return;
      }

      this.notificationService.notifyDocumentDeclinedByVolunteer({
        recipientUserIds,
        documentId: input.documentId,
        documentKind: input.documentKind,
        organizationName: organization?.name ?? '',
        organizationUnitId: rootUnit.id,
        volunteerName: volunteer?.name ?? '',
        reason: input.reason,
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit declined-by-volunteer notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
