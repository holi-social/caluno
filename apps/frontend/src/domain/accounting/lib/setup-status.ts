import type { RawAccountingSetupStatus } from '@repo/data';
import type { PauschalenType } from '../components/doc-type-header';
import { pauschaleForReimbursementTypeKey } from './reimbursement-type-mapping';

export type SetupBlocker =
  | { kind: 'org-profile'; missingFields: string[] }
  | { kind: 'templates'; pauschalen: PauschalenType[] };

/** What stops the admin from authoring templates, if anything. */
export function templateSetupBlocker(
  status: RawAccountingSetupStatus | undefined,
): SetupBlocker | null {
  if (!status) return null;
  if (status.orgProfileComplete) return null;
  return { kind: 'org-profile', missingFields: status.missingOrgProfileFields };
}

/**
 * What stops the admin from creating documents, if anything. Org profile wins
 * when both gates are unmet: templates cannot be authored until it is filled,
 * so pointing at the template builder would dead-end them.
 */
export function documentCreationBlocker(
  status: RawAccountingSetupStatus | undefined,
): SetupBlocker | null {
  if (!status) return null;
  const orgBlocker = templateSetupBlocker(status);
  if (orgBlocker) return orgBlocker;
  if (status.canCreateDocuments) return null;
  return {
    kind: 'templates',
    pauschalen: status.slots
      .filter((slot) => !slot.ready)
      .map((slot) =>
        pauschaleForReimbursementTypeKey(slot.reimbursementTypeKey),
      ),
  };
}
