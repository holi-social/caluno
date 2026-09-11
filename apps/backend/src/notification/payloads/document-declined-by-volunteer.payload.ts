import type { DocumentKind } from '../../accounting/enums';

/**
 * Emitted when the volunteer declines a document (their own signature step)
 * with a reason. Unlike DOCUMENT_DECLINED_BY_ORG this has never notified
 * anyone (see VOLI-1246): the admin who needs to correct and reissue the
 * document had no way to learn a decline happened at all.
 */
export interface DocumentDeclinedByVolunteerPayload {
  recipientUserIds: string[];
  documentId: string;
  documentKind: DocumentKind;
  organizationName: string;
  organizationUnitId: string;
  volunteerName: string;
  reason: string;
}
