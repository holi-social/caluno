import type { DocumentKind } from '../../accounting/enums';

/**
 * Emitted right after a contract/invoice is created in
 * AWAITING_VOLUNTEER_SIGNATURE — the only proactive notification the
 * volunteer gets, because it is the only state that asks something of them.
 */
export interface DocumentAwaitingSignaturePayload {
  volunteerUserId: string;
  documentId: string;
  documentKind: DocumentKind;
  organizationName: string;
}
