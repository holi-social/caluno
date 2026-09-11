import type { DocumentKind } from '../../accounting/enums';

/**
 * Emitted when the organisation side declines a document the volunteer had
 * already signed — the volunteer would otherwise have no way to learn it is
 * dead.
 */
export interface DocumentDeclinedByOrgPayload {
  volunteerUserId: string;
  documentId: string;
  documentKind: DocumentKind;
  organizationName: string;
  reason: string;
}
